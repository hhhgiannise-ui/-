const api = require('../../api/index')

Page({
  data: {
    openid: '',
    nickname: '',
    loggedIn: false,
    mistakes: []
  },

  async onLoad() {
    this.loadMistakes()
  },

  async onShow() {
    this.loadMistakes()
  },

  async handleLogin() {
    wx.showLoading({ title: '登录中...' })
    try {
      const { user } = await api.login()
      this.setData({
        openid: user.openid,
        nickname: user.nickname || '',
        loggedIn: true
      })
      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    }
  },

  async loadMistakes() {
    try {
      const { list } = await api.getMistakeList({ page: 1, pageSize: 20 })
      this.setData({ mistakes: list })
    } catch (err) {
      // 云函数未部署时静默，登录后重试
      console.warn('加载列表失败（云函数可能未部署）:', err.message)
    }
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})
