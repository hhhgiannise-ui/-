<template>
  <view class="page">
    <view class="card">
      <view class="form-item">
        <text class="form-label">科目</text>
        <input
          class="form-input"
          placeholder="如：数学 / 英语 / 政治"
          v-model="subject"
        />
      </view>
      <view class="form-item">
        <text class="form-label">题干</text>
        <textarea
          class="form-textarea"
          placeholder="手动输入题目内容（拍照 / OCR 将在下一阶段开放）"
          v-model="stem"
          maxlength="2000"
        />
      </view>
      <button class="btn-primary submit-btn" @click="handleSubmit">提交错题</button>
      <view class="form-tip">提交后将进入 AI 分析（下一阶段开放），错题数据会安全存入云数据库。</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { createMistake } from '@/api'

const subject = ref('')
const stem = ref('')

const handleSubmit = async () => {
  if (!subject.value || !stem.value) {
    uni.showToast({ title: '科目和题干必填', icon: 'none' })
    return
  }
  uni.showLoading({ title: '提交中...' })
  try {
    await createMistake({ subject: subject.value, stem: stem.value, source: 'manual' })
    uni.hideLoading()
    uni.showToast({ title: '录入成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: err.message || '提交失败', icon: 'none' })
  }
}
</script>

<style>
.page {
  padding-top: 20rpx;
}
.form-item {
  margin-bottom: 32rpx;
}
.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}
.form-input {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
.form-textarea {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  height: 260rpx;
}
.submit-btn {
  margin-top: 20rpx;
}
.form-tip {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #999;
  text-align: center;
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
