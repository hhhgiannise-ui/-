/**
 * 云函数：login — 微信一键登录（API 文档 §3.1）
 * 依据：getWXContext 获取 openid
 * https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/get-wx-context.html
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const users = db.collection('users')

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 401, message: '未登录', data: null }
  }

  try {
    const exist = await users.where({ openid: OPENID }).limit(1).get()

    if (exist.data.length === 0) {
      const now = Date.now()
      const res = await users.add({
        data: {
          openid: OPENID,
          nickname: '',
          avatarUrl: '',
          createTime: now,
          updateTime: now
        }
      })
      return {
        code: 0,
        message: 'ok',
        data: { user: { _id: res._id, openid: OPENID, nickname: '' } }
      }
    }

    const user = exist.data[0]
    return {
      code: 0,
      message: 'ok',
      data: { user: { _id: user._id, openid: user.openid, nickname: user.nickname || '' } }
    }
  } catch (err) {
    console.error('login 失败:', err)
    return { code: 500, message: '登录服务异常', data: null }
  }
}
