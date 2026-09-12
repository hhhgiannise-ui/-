<template>
  <view class="page">
    <view class="hero">
      <text class="hero-title">错题追问教练</text>
      <text class="hero-sub">不告诉你答案的考研错题教练</text>
    </view>

    <view v-if="!loggedIn" class="card login-card">
      <text class="login-tip">第一步：微信登录（调用第一个云函数）</text>
      <button class="btn-primary" @click="handleLogin">微信一键登录</button>
    </view>

    <view v-else class="card login-card">
      <text class="login-tip">已登录 ✓ openid: {{ openid }}</text>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="section-title">错题列表</text>
        <text class="section-action" @click="goAdd">＋ 录题</text>
      </view>

      <view v-if="mistakes.length === 0" class="empty">
        <text>还没有错题，点右上角「＋ 录题」开始</text>
      </view>

      <view
        v-for="item in mistakes"
        :key="item._id"
        class="mistake-item"
        @click="goDetail(item._id)"
      >
        <view class="mistake-subject">{{ item.subject }}</view>
        <view class="mistake-stem">{{ item.stem }}</view>
        <view class="mistake-status">状态：{{ statusText(item.status) }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { login, getMistakeList } from '@/api'

const openid = ref('')
const loggedIn = ref(false)
const mistakes = ref([])

const statusText = (s) => {
  const map = { 0: '待分析', 1: '分析中', 2: '已分析', 3: '分析失败' }
  return map[s] || '未知'
}

const loadMistakes = async () => {
  try {
    const { list } = await getMistakeList({ page: 1, pageSize: 20 })
    mistakes.value = list
  } catch (err) {
    console.warn('加载列表失败（云函数可能未部署）:', err.message)
  }
}

const handleLogin = async () => {
  uni.showLoading({ title: '登录中...' })
  try {
    const { user } = await login()
    openid.value = user.openid
    loggedIn.value = true
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
    loadMistakes()
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: err.message || '登录失败', icon: 'none' })
  }
}

const goAdd = () => uni.navigateTo({ url: '/pages/add/add' })
const goDetail = (id) => uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })

onLoad(loadMistakes)
onShow(loadMistakes)
</script>

<style>
.hero {
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}
.hero-title {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
}
.hero-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #999;
}
.login-card {
  display: flex;
  flex-direction: column;
}
.login-tip {
  margin-bottom: 20rpx;
  color: #666;
  font-size: 26rpx;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 600;
}
.section-action {
  color: #1aad19;
  font-size: 28rpx;
}
.empty {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
.mistake-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.mistake-item:last-child {
  border-bottom: none;
}
.mistake-subject {
  display: inline-block;
  font-size: 22rpx;
  color: #1aad19;
  background: #e8f7e8;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}
.mistake-stem {
  margin-top: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mistake-status {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.btn-primary {
  background: #1aad19;
  color: #fff;
  border-radius: 12rpx;
}
</style>
