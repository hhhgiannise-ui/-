<script>
const ENV_ID = 'my-diary-d2goz6lgh3e20a17e'

export default {
  onLaunch() {
    // 平台决策（项目指南 §3）：uni-app 编译到微信小程序端时保留 wx 全局对象
    // 此处仅在小程序端生效；H5 端若启用需改用 Web SDK + 条件编译
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 以上基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: ENV_ID,
      traceUser: true
    })
  }
}
</script>

<style>
page {
  background: #f6f6f6;
  font-size: 28rpx;
  color: #333;
}
</style>
