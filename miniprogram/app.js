const ENV_ID = 'my-diary-d2goz6lgh3e20a17e'

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 以上基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: ENV_ID,
      traceUser: true
    })
  },

  globalData: {
    envId: ENV_ID,
    openid: ''
  }
})
