/**
 * 云函数：getMistakeList — 错题列表（分页，API 文档 §3.4）
 * 依据：openid 数据隔离 + createTime 降序，复合索引见数据库设计 §5
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const mistakes = db.collection('mistakes')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 401, message: '未登录', data: null }
  }

  const page = Math.max(1, parseInt(event?.page) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(event?.pageSize) || 20))

  try {
    const [listRes, countRes] = await Promise.all([
      mistakes
        .where({ openid: OPENID })
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get(),
      mistakes.where({ openid: OPENID }).count()
    ])
    return { code: 0, message: 'ok', data: { list: listRes.data, total: countRes.total } }
  } catch (err) {
    console.error('getMistakeList 失败:', err)
    return { code: 500, message: '查询失败，请稍后重试', data: null }
  }
}
