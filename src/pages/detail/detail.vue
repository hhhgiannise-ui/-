<template>
  <view class="page">
    <view v-if="mistake" class="card">
      <view class="subject">{{ mistake.subject }}</view>
      <view class="stem">{{ mistake.stem }}</view>
    </view>

    <view v-if="analyses.length > 0" class="card">
      <view class="section-title">AI 分析</view>
      <view v-for="a in analyses" :key="a._id" class="analysis">
        <view class="tag-row">
          <text v-for="tag in a.knowledgeTags" :key="tag" class="tag">{{ tag }}</text>
        </view>
        <view class="row"><text class="row-label">错误原因：</text>{{ a.errorCause }}</view>
        <view class="row"><text class="row-label">难度：</text>{{ a.difficulty }}</view>
        <view v-for="(step, i) in a.steps" :key="step.title" class="step">
          <view class="step-title">{{ i + 1 }}. {{ step.title }}</view>
          <view class="step-content">{{ step.content }}</view>
        </view>
      </view>
    </view>

    <view v-else class="card empty-card">
      <text>AI 分析将在下一阶段开放</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMistakeDetail } from '@/api'

const mistake = ref(null)
const analyses = ref([])

onLoad(async (options) => {
  const { id } = options
  try {
    const res = await getMistakeDetail(id)
    mistake.value = res.mistake
    analyses.value = res.analyses
  } catch (err) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  }
})
</script>

<style>
.page {
  padding-top: 20rpx;
}
.subject {
  display: inline-block;
  font-size: 22rpx;
  color: #1aad19;
  background: #e8f7e8;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}
.stem {
  margin-top: 16rpx;
  font-size: 30rpx;
  line-height: 1.7;
}
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.tag-row {
  margin-bottom: 16rpx;
}
.tag {
  display: inline-block;
  background: #f0f7ff;
  color: #2b7de9;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}
.row {
  font-size: 28rpx;
  line-height: 1.6;
  margin-bottom: 12rpx;
}
.row-label {
  color: #666;
}
.step {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #fafafa;
  border-radius: 12rpx;
}
.step-title {
  font-size: 28rpx;
  font-weight: 600;
}
.step-content {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
}
.empty-card {
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
</style>
