Page({
  data: {
    id: '',
    mistake: null,
    analyses: []
  },

  async onLoad(options) {
    const { id } = options
    this.setData({ id })
    const api = require('../../api/index')
    try {
      const { mistake, analyses } = await api.getMistakeDetail(id)
      this.setData({ mistake, analyses })
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  }
})
