/**
 * 云函数：analyzeMistake — 触发 AI 分析（API 文档 §3.3）
 * 关键设计（API 文档 §3.3）：状态机防重 0待分析→1分析中→2已分析/3失败
 * 依据：AI 产出写入附属集合 mistake_analyses（数据库设计 §2 主/附属分离）
 * 密钥管理：DeepSeek API Key 通过云函数环境变量注入，不写入代码仓库
 */
const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const mistakes = db.collection('mistakes')
const analyses = db.collection('mistake_analyses')

const API_KEY = process.env.DEEPSEEK_API_KEY
const LLM_HOST = 'api.deepseek.com'
const LLM_PATH = '/chat/completions'
const LLM_MODEL = 'deepseek-chat'

const buildPrompt = (m) => `你是资深考研辅导老师。请分析下面这道错题，只输出 JSON（不要输出任何其他文字）：
科目：${m.subject}
题目：${m.stem}
要求输出：
{"errorCause":"出错的根本原因","knowledgeTags":["知识点1","知识点2"],"difficulty":"简单|中等|较难","steps":[{"title":"步骤名","content":"具体讲解内容"}]}`

const callLLM = (prompt) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
    const req = https.request(
      {
        hostname: LLM_HOST,
        path: LLM_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 30000
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            const content = json.choices && json.choices[0] && json.choices[0].message.content
            if (content) resolve(content)
            else reject(new Error('LLM 响应异常: ' + data.slice(0, 200)))
          } catch (e) {
            reject(e)
          }
        })
      }
    )
    req.on('timeout', () => req.destroy(new Error('LLM 请求超时')))
    req.on('error', reject)
    req.write(body)
    req.end()
  })

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { mistakeId } = event || {}
  if (!OPENID) {
    return { code: 401, message: '未登录', data: null }
  }
  if (!mistakeId) {
    return { code: 400, message: '缺少 mistakeId', data: null }
  }
  if (!API_KEY) {
    console.error('analyzeMistake: 未配置 DEEPSEEK_API_KEY 环境变量')
    return { code: 500, message: '服务端未配置 AI 密钥', data: null }
  }

  let mistake
  try {
    mistake = (await mistakes.doc(mistakeId).get()).data
  } catch (err) {
    return { code: 404, message: '错题不存在', data: null }
  }
  if (!mistake || mistake.openid !== OPENID) {
    return { code: 404, message: '错题不存在', data: null }
  }

  // 状态机防重：只有"待分析"允许触发，防止重复扣费
  if (mistake.status !== 0) {
    const msg = mistake.status === 1 ? '该题正在分析中，请稍候' : '该题已完成分析，无需重复操作'
    return { code: 409, message: msg, data: null }
  }

  await mistakes.doc(mistakeId).update({ data: { status: 1, analyzeTime: Date.now() } })

  try {
    const content = await callLLM(buildPrompt(mistake))
    const parsed = JSON.parse(content)
    const addRes = await analyses.add({
      mistakeId,
      openid: OPENID,
      errorCause: String(parsed.errorCause || '').slice(0, 500),
      knowledgeTags: Array.isArray(parsed.knowledgeTags) ? parsed.knowledgeTags.slice(0, 10) : [],
      difficulty: parsed.difficulty || '中等',
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 10) : [],
      model: LLM_MODEL,
      createTime: Date.now()
    })
    await mistakes.doc(mistakeId).update({ data: { status: 2, analysisId: addRes._id } })
    return { code: 0, message: 'ok', data: null }
  } catch (err) {
    console.error('analyzeMistake 失败:', err)
    await mistakes.doc(mistakeId).update({ data: { status: 3 } })
    return { code: 500, message: 'AI 分析失败，请重试', data: null }
  }
}
