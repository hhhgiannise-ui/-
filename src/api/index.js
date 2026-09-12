/**
 * 云函数调用统一封装（对应 API 文档 §4）
 * 平台决策：小程序端调用 wx.cloud.callFunction（uni-app 保留 wx 全局对象）
 * 参考：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/functions/Cloud.callFunction.html
 */
const call = (name, data = {}) =>
  wx.cloud.callFunction({ name, data }).then(res => {
    const { code, message, data: body } = res.result
    if (code !== 0) {
      throw new Error(`${name} 失败: ${message} (code=${code})`)
    }
    return body
  })

export const login = () => call('login')
export const createMistake = (data) => call('createMistake', data)
export const analyzeMistake = (id) => call('analyzeMistake', { mistakeId: id })
export const getMistakeList = (query) => call('getMistakeList', query)
export const getMistakeDetail = (id) => call('getMistakeDetail', { mistakeId: id })
