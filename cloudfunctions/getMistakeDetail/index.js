/**
 * 云函数：getMistakeDetail — 错题详情（API 文档 §3.5）
 * 依据：主/附属分离原则（数据库设计 §2），两次查询替代 JOIN
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const mistakes = db.collection('mistakes')
const analyses = db.collection('mistake_analyses')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { mistakeId } = event || {}
  if (!OPENID) {
    return { code: 401, message: '未登录', data: null }
  }
  if (!mistakeId) {
    return { code: 400, message: '缺少 mistakeId', data: null }
  }

  try {
    const mistake = (await mistakes.doc(mistakeId).get()).data
    if (!mistake || mistake.openid !== OPENID) {
      return { code: 404, message: '错题不存在', data: null }
    }

    const listRes = await analyses
      .where({ mistakeId })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()

    return { code: 0, message: 'ok', data: { mistake, analyses: listRes.data } }
  } catch (err) {
    console.error('getMistakeDetail 失败:', err)
    return { code: 500, message: '查询失败，请稍后重试', data: null }
  }
}
