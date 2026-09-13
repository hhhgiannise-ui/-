/**
 * 云函数：askFollowup — 追问教练（API 文档 §3.6，V1.1 简化版）
 * 设计：一问一答，历史上下文最近 12 条；对话写入 probe_turns（数据库设计 §3.4）
 * 提示词约束（PRD §4.3）：优先引导思考，学生明确要答案才给完整解析
 */
const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const mistakes = db.collection('mistakes')
const analyses = db.collection('mistake_analyses')
const turns = db.collection('probe_turns')

const API_KEY = process.env.DEEPSEEK_API_KEY
const LLM_HOST = 'api.deepseek.com'
const LLM_PATH = '/chat/completions'
const LLM_MODEL = 'deepseek-chat'
const MAX_HISTORY = 12
const MAX_ANSWER = 2000

const SYSTEM_PROMPT = `你是"错题追问教练"中的资深考研辅导老师。回答原则：
1. 优先用追问引导学生自己思考，不要直接给答案；
2. 只有当学生明确说"要答案""不会""给我解析"时，才给出完整清晰的解析；
3. 回答要结合这道错题和已有的分析结果，具体、不空泛；
4. 用中文回答，控制在 300 字以内。`

const callLLM = (messages) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.5
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
  const { mistakeId, question } = event || {}
  if (!OPENID) {
    return { code: 401, message: '未登录', data: null }
  }
  if (!mistakeId) {
    return { code: 400, message: '缺少 mistakeId', data: null }
  }
  if (typeof question !== 'string' || question.trim() === '' || question.length > 500) {
    return { code: 400, message: '提问必填且不超过 500 字', data: null }
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
  if (!API_KEY) {
    console.error('askFollowup: 未配置 DEEPSEEK_API_KEY 环境变量')
    return { code: 500, message: '服务端未配置 AI 密钥', data: null }
  }

  try {
    const latestAnalysis = (
      await analyses.where({ mistakeId }).orderBy('createTime', 'desc').limit(1).get()
    ).data[0]
    const history = (
      await turns.where({ mistakeId, openid: OPENID }).orderBy('createTime', 'desc').limit(MAX_HISTORY).get()
    ).data.reverse()

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
    messages.push({ role: 'user', content: `错题科目：${mistake.subject}\n题干：${mistake.stem}` })
    if (latestAnalysis) {
      messages.push({
        role: 'user',
        content:
          `已有分析：错因=${latestAnalysis.errorCause}，` +
          `知识点=${(latestAnalysis.knowledgeTags || []).join('、')}，` +
          `难度=${latestAnalysis.difficulty}，步骤=${JSON.stringify(latestAnalysis.steps || [])}`
      })
    }
    history.forEach((t) =>
      messages.push({ role: t.role === 'user' ? 'user' : 'assistant', content: t.content })
    )
    messages.push({ role: 'user', content: `我的追问：${question.trim()}` })

    const answer = String(await callLLM(messages)).slice(0, MAX_ANSWER)
    const now = Date.now()
    // add 参数必须包 { data }，教训见 AGENTS.md 经验教训
    await turns.add({ data: { mistakeId, openid: OPENID, role: 'user', content: question.trim(), createTime: now } })
    await turns.add({ data: { mistakeId, openid: OPENID, role: 'assistant', content: answer, createTime: now + 1 } })

    return { code: 0, message: 'ok', data: { answer } }
  } catch (err) {
    console.error('askFollowup 失败:', err)
    return { code: 500, message: 'AI 暂时走神了，请稍后再试', data: null }
  }
}
