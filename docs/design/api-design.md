# 错题追问教练 — API 设计 v1.0

> 状态：定稿（2026-09-12）
> 依据：[CloudBase 云函数](https://docs.cloudbase.net/cloud-function/introduce) | [小程序端调用云函数 callFunction](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/functions/Cloud.callFunction.html) | [云函数获取微信上下文 getWXContext](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/get-wx-context.html)
> 关联：[PRD v1.0](../prd/PRD_v1.0.md) | [项目指南](./project-guide.md) | [数据库设计](./database-design.md)

---

## 1. 通信架构（先看懂全貌）

```
小程序页面 ──wx.cloud.callFunction()──▶ 云函数（Node.js） ──▶ 云数据库 / 大模型 API
      ▲                                        │
      └──────────── { code, message, data } ◀──┘
```

- 前端**不直连**大模型，也**不直连**敏感操作——一律经云函数，保证校验和密钥安全
- 所有函数运行于云环境，天然获取 `openid`，无需自己传用户标识

---

## 2. 统一响应格式（全项目锁定）

```json
{ "code": 0, "message": "ok", "data": {} }
```

### 错误码表（全项目统一）

| code | 含义 | 触发场景 |
|------|------|----------|
| 0 | 成功 | — |
| 401 | 未登录 | 云函数拿不到 OPENID |
| 403 | 无权限 / 内容违规 | 操作他人数据 / msgSecCheck 未过 |
| 404 | 不存在 | mistakeId 查无此记录 |
| 1001 | 参数校验失败 | 必填缺失 / 类型错误 |
| 500 | 服务端错误 | 数据库/模型异常 |

---

## 3. V1 云函数接口清单（5 个）

### 3.1 login — 微信登录

| 项 | 内容 |
|----|------|
| 入参 | `{}`（openid 从上下文自动获取） |
| 逻辑 | `getWXContext().OPENID` → 按 openid upsert `users` |
| 出参 | `data: { user: { _id, nickname, createTime } }` |
| 权限 | 所有用户可调 |

### 3.2 createMistake — 创建错题

| 项 | 内容 |
|----|------|
| 入参 | `{ subject, stem, source, imageFileId?, ocrText? }` |
| 校验 | subject/stem 必填；source ∈ photo/manual/ocr；photo 必须带 imageFileId |
| 内容安全 | 对 `stem` 调用 `msgSecCheck`，违规返回 403 |
| 出参 | `data: { id }` |
| 错误码 | 1001 参数错误 / 403 内容违规 |

### 3.3 analyzeMistake — 触发 AI 分析（核心异步）

| 项 | 内容 |
|----|------|
| 入参 | `{ mistakeId }` |
| 逻辑 | ① 校验 `status === 0`（**状态机防重复**）→ 置 1 → ② 调大模型 → ③ 写 `mistake_analyses` + `ai_call_logs` → ④ 置 2；失败置 3 |
| 出参 | `data: { analysis }` |
| 幂等设计 | 状态非 0 直接返回 403「分析进行中或已完成」，杜绝并发重复扣费 |
| 错误码 | 404 错题不存在 / 403 状态不允许 / 500 模型失败 |

### 3.4 getMistakeList — 错题列表

| 项 | 内容 |
|----|------|
| 入参 | `{ page = 1, pageSize = 10, subject? }` |
| 逻辑 | openid 隔离 + 可选科目过滤，按 createTime 倒序 |
| 出参 | `data: { list, total, hasMore }` |
| 分页约定 | page 从 1 开始；pageSize ≤ 50 |

### 3.5 getMistakeDetail — 错题详情

| 项 | 内容 |
|----|------|
| 入参 | `{ mistakeId }` |
| 逻辑 | 查 `mistakes` + 按 mistakeId 查 `mistake_analyses`（两次查询，替代 JOIN） |
| 出参 | `data: { mistake, analyses: [ ... ] }` |
| 错误码 | 404 不存在 |

---

## 4. 前端调用约定

统一封装在 `miniprogram/api/index.js`（对应你熟悉的 `api/` 目录惯例）：

```js
const call = (name, data = {}) =>
  wx.cloud.callFunction({ name, data }).then(res => {
    const { code, message, data: body } = res.result
    if (code !== 0) throw new Error(`${name} 失败: ${message} (code=${code})`)
    return body
  })

export const login = () => call('login')
export const createMistake = (data) => call('createMistake', data)
export const analyzeMistake = (id) => call('analyzeMistake', { mistakeId: id })
export const getMistakeList = (query) => call('getMistakeList', query)
export const getMistakeDetail = (id) => call('getMistakeDetail', { mistakeId: id })
```

---

## 5. V2+ 接口规划（仅设计，不实现）

| 阶段 | 接口 | 说明 |
|------|------|------|
| P1 | `updateMistake` / `deleteMistake` | 编辑、删除（敏感操作，走云函数） |
| V2 | `startProbe` / `answerProbe` / `getProbeState` | 追问引擎（S0–S5 状态机） |
| V3 | `generateVariant` / `verifyVariant` | 变式题生成 + 三重校验 |
| V4 | `getReviewPlan` / `submitReview` | 复习调度 |

---

## 6. 关键设计决策（评审重点）

1. **analyzeMistake 用状态机防重**：`status: 0 → 1 → 2/3`，状态非 0 拒绝触发——防止用户狂点按钮导致重复调用大模型、重复扣费（这是 AI 应用最常见的成本事故）
2. **内容安全内嵌在 createMistake**：入参即校验，违规内容不进库
3. **敏感操作全走云函数**：写操作（增/改/删）不经客户端直连，读操作未来可用安全规则放开（见数据库设计 §6）
