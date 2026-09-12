/**
 * 云函数调用统一封装（对应 API 文档 §4）
 * 用法：const api = require('../api/index')
 */
const call = (name, data = {}) =>
  wx.cloud.callFunction({ name, data }).then(res => {
    const { code, message, data: body } = res.result
    if (code !== 0) {
      throw new Error(`${name} 失败: ${message} (code=${code})`)
    }
    return body
  })

module.exports = {
  login: () => call('login'),
  createMistake: (data) => call('createMistake', data),
  analyzeMistake: (id) => call('analyzeMistake', { mistakeId: id }),
  getMistakeList: (query) => call('getMistakeList', query),
  getMistakeDetail: (id) => call('getMistakeDetail', { mistakeId: id })
}
