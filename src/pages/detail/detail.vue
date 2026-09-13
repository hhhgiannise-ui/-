<template>
  <view class="page">
    <view v-if="mistake" class="card">
      <view class="subject">{{ mistake.subject }}</view>
      <view class="stem">{{ mistake.stem }}</view>
      <view class="status-line">状态：{{ statusText(mistake.status) }}</view>
      <button
        v-if="mistake.status === 0 || mistake.status === 3"
        class="btn-analyze"
        :loading="analyzing"
        @click="handleAnalyze"
      >{{ mistake.status === 3 ? '重新分析' : '开始 AI 分析' }}</button>
      <view v-else-if="mistake.status === 1" class="analyzing">AI 分析中，请稍候...</view>
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

    <view v-else-if="mistake && mistake.status === 2" class="card empty-card">
      <text>暂无分析结果</text>
    </view>

    <view v-if="mistake && mistake.status === 2" class="card">
      <view class="section-title">追问教练</view>
      <view class="chat-list">
        <view v-for="t in turns" :key="t._id" class="msg" :class="t.role === 'user' ? 'msg-user' : 'msg-ai'">
          <text class="msg-text">{{ t.content }}</text>
        </view>
        <view v-if="sending" class="msg msg-ai">
          <text class="msg-text">思考中...</text>
        </view>
      </view>
      <view class="chat-input-row">
        <input
          v-model="question"
          class="chat-input"
          placeholder="向教练追问，如：我哪里想错了？"
          confirm-type="send"
          :disabled="sending"
          @confirm="handleSend"
        />
        <button class="chat-send" :loading="sending" @click="handleSend">发送</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getMistakeDetail, analyzeMistake, askFollowup } from '@/api'

const mistake = ref(null)
const analyses = ref([])
const analyzing = ref(false)
const turns = ref([])
const question = ref('')
const sending = ref(false)

const statusText = (s) => ({ 0: '待分析', 1: '分析中', 2: '已分析', 3: '分析失败' }[s] || '未知')

const loadDetail = async (id) => {
  try {
    const res = await getMistakeDetail(id)
    mistake.value = res.mistake
    analyses.value = res.analyses
    turns.value = res.turns || []
  } catch (err) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  }
}

const handleAnalyze = async () => {
  analyzing.value = true
  uni.showLoading({ title: 'AI 分析中...', mask: true })
  try {
    await analyzeMistake(mistake.value._id)
    uni.hideLoading()
    uni.showToast({ title: '分析完成', icon: 'success' })
    await loadDetail(mistake.value._id)
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: err.message || '分析失败', icon: 'none' })
  } finally {
    analyzing.value = false
  }
}

const handleSend = async () => {
  const q = question.value.trim()
  if (!q || sending.value) return
  sending.value = true
  try {
    const { answer } = await askFollowup(mistake.value._id, q)
    const now = Date.now()
    turns.value.push({ _id: 'u' + now, role: 'user', content: q })
    turns.value.push({ _id: 'a' + now, role: 'assistant', content: answer })
    question.value = ''
  } catch (err) {
    uni.showToast({ title: err.message || '追问失败', icon: 'none' })
  } finally {
    sending.value = false
  }
}

onLoad((options) => loadDetail(options.id))
onShow((options) => {
  if (mistake.value) loadDetail(mistake.value._id)
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
.status-line {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #999;
}
.btn-analyze {
  margin-top: 20rpx;
  background: #2b7de9;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.analyzing {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #2b7de9;
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
.chat-list {
  display: flex;
  flex-direction: column;
  max-height: 600rpx;
  overflow-y: auto;
}
.msg {
  max-width: 80%;
  margin-bottom: 16rpx;
  padding: 14rpx 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-all;
}
.msg-user {
  align-self: flex-end;
  background: #2b7de9;
  color: #fff;
  border-bottom-right-radius: 4rpx;
}
.msg-ai {
  align-self: flex-start;
  background: #f2f3f5;
  color: #333;
  border-bottom-left-radius: 4rpx;
}
.chat-input-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}
.chat-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f5f6f7;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.chat-send {
  margin-left: 16rpx;
  padding: 0 32rpx;
  background: #2b7de9;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 72rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
</style>
