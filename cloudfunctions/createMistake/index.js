/**
 * 云函数：createMistake — 创建错题（API 文档 §3.2）
 * 依据：getWXContext 获取 openid 实现数据隔离
 * https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/get-wx-context.html
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const mistakes = db.collection('mistakes')

const SOURCES = ['manual', 'ocr', 'photo']

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 401, message: '未登录', data: null }
  }

  const { subject, stem, source = 'manual' } = event || {}

  if (typeof subject !== 'string' || subject.trim() === '' || subject.length > 50) {
    return { code: 400, message: '科目必填且不超过 50 字', data: null }
  }
  if (typeof stem !== 'string' || stem.trim() === '' || stem.length > 2000) {
    return { code: 400, message: '题干必填且不超过 2000 字', data: null }
  }
  if (!SOURCES.includes(source)) {
    return { code: 400, message: '来源不合法', data: null }
  }

  try {
    const now = Date.now()
    const res = await mistakes.add({
      data: {
        subject: subject.trim(),
        stem: stem.trim(),
        source,
        status: 0, // 0 待分析，见数据库设计 §枚举
        openid: OPENID,
        createTime: now,
        updateTime: now
      }
    })
    return { code: 0, message: 'ok', data: { id: res._id } }
  } catch (err) {
    console.error('createMistake 失败:', err)
    return { code: 500, message: '录入失败，请稍后重试', data: null }
  }
}
