Page({
  data: {
    subject: '',
    stem: ''
  },

  onSubjectInput(e) {
    this.setData({ subject: e.detail.value })
  },

  onStemInput(e) {
    this.setData({ stem: e.detail.value })
  },

  async handleSubmit() {
    const { subject, stem } = this.data
    if (!subject || !stem) {
      wx.showToast({ title: '科目和题干必填', icon: 'none' })
      return
    }
    const api = require('../../api/index')
    wx.showLoading({ title: '提交中...' })
    try {
      const { id } = await api.createMistake({ subject, stem, source: 'manual' })
      wx.hideLoading()
      wx.showToast({ title: '录入成功', icon: 'success' })
      wx.navigateBack()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    }
  }
})
