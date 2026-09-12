# 错题追问教练 — 数据库设计 v1.0

> 状态：定稿（2026-09-12）
> 依据：[CloudBase 云数据库文档](https://docs.cloudbase.net/database/introduce) | [索引设计](https://docs.cloudbase.net/database/index) | [安全规则](https://docs.cloudbase.net/database/security-rules)
> 关联：[PRD v1.0](../prd/PRD_v1.0.md) | [项目指南](./project-guide.md)

---

## 1. 设计原则（全项目不可违背）

| # | 原则 | 说明 |
|---|------|------|
| P1 | **主/附属分离** | `mistakes` 只存用户原始录入；AI 产出一律进附属集合（`mistake_analyses` 等），可重跑、可回滚、可对比版本 |
| P2 | **openid 隔离** | 除 `_id` 外，每个业务集合都必须带 `openid` 字段，作为数据隔离第一键（对应 MySQL 的租户字段） |
| P3 | **时间戳统一** | 一律存毫秒时间戳（number 类型），字段名 `createTime` / `updateTime`，不存字符串日期 |
| P4 | **状态显式枚举** | 所有状态字段用数字枚举（0/1/2），字典见 §4，禁止自由字符串 |
| P5 | **金额/费用用整数"分"** | `costCent` 存分，避免浮点误差（沿用后端惯例） |

---

## 2. 集合总览

### V1 实建（4 个）

| 集合 | 归属 | 读写方 | 用途 |
|------|------|--------|------|
| `users` | 主数据 | 客户端读写 / 云函数 | 用户资料 |
| `mistakes` | **主数据** | 客户端写 / 云函数读 | 错题（原题 + 校对文本），全项目核心 |
| `mistake_analyses` | AI 附属 | 云函数写 / 客户端读 | AI 结构化分析结果 |
| `ai_call_logs` | 系统附属 | 云函数写 | AI 调用审计：模型、token、费用 |

### V2+ 规划（暂不建，设计先行）

| 集合 | 阶段 | 用途 |
|------|------|------|
| `probe_sessions` / `probe_turns` | V2 | 追问引擎会话与轮次（S0–S5 状态机） |
| `variant_questions` | V3 | AI 变式题（含 verifyStatus 三重校验） |
| `review_schedules` | V4 | 复习调度（间隔、EF、下次复习时间） |

---

## 3. 字段设计

### 3.1 users

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | string | ✅ | 自动生成 |
| `openid` | string | ✅ | 微信登录获取，**唯一索引** |
| `nickname` | string | ❌ | 用户昵称 |
| `avatarUrl` | string | ❌ | 头像 |
| `createTime` | number | ✅ | 注册时间 |
| `updateTime` | number | ✅ | 最近更新 |

### 3.2 mistakes（核心集合）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | string | ✅ | 自动生成 |
| `openid` | string | ✅ | 隔离键 |
| `subject` | string | ✅ | 科目：数学/英语/政治/专业课 |
| `chapter` | string | ❌ | 章节（P1 启用） |
| `source` | enum | ✅ | 录入来源：`photo` / `manual` / `ocr` |
| `imageFileId` | string | ❌ | 云存储文件 ID（`photo` 来源必填） |
| `ocrText` | string | ❌ | OCR 原始识别文本（`ocr` 来源） |
| `stem` | string | ✅ | **人工校对后的标准题干**（业务权威文本） |
| `answer` | string | ❌ | 正确解答（P1 启用） |
| `status` | enum | ✅ | 0 待分析 / 1 分析中 / 2 已分析 / 3 分析失败 |
| `mastery` | number | ✅ | 掌握度 0–5，默认 0（P1 起用） |
| `createTime` | number | ✅ | 录入时间 |
| `updateTime` | number | ✅ | 最近更新 |

### 3.3 mistake_analyses（AI 附属）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | string | ✅ | 自动生成 |
| `mistakeId` | string | ✅ | 关联 `mistakes._id`（外键思想） |
| `openid` | string | ✅ | 冗余隔离键，便于按人查询 |
| `knowledgeTags` | array\<string\> | ✅ | 知识点标签 |
| `errorCause` | string | ✅ | 错误原因分类 |
| `difficulty` | enum | ✅ | `easy` / `medium` / `hard` |
| `steps` | array\<object\> | ✅ | `[{ title, content }]` 解题步骤 |
| `suggestion` | string | ❌ | 学习建议 |
| `model` | string | ✅ | 产出模型（如 deepseek-v3） |
| `promptVer` | string | ✅ | Prompt 版本（审计关键） |
| `createTime` | number | ✅ | 分析时间 |

### 3.4 ai_call_logs（系统附属）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | string | ✅ | 自动生成 |
| `openid` | string | ✅ | 触发用户 |
| `bizType` | enum | ✅ | `analyze` / `probe` / `variant` / `review` |
| `model` | string | ✅ | 模型名 |
| `promptTokens` | number | ✅ | 输入 token 数 |
| `outputTokens` | number | ✅ | 输出 token 数 |
| `success` | bool | ✅ | 是否成功 |
| `errorMsg` | string | ❌ | 失败原因 |
| `costCent` | number | ✅ | 费用（单位：分） |
| `latencyMs` | number | ❌ | 耗时（毫秒） |
| `createTime` | number | ✅ | 调用时间 |

---

## 4. 枚举字典（全项目统一，禁止魔数散落）

| 字段 | 值 | 含义 |
|------|----|------|
| `mistakes.status` | 0 / 1 / 2 / 3 | 待分析 / 分析中 / 已分析 / 分析失败 |
| `mistakes.source` | photo / manual / ocr | 拍照 / 手动输入 / OCR |
| `difficulty` | easy / medium / hard | 易 / 中 / 难 |
| `bizType` | analyze / probe / variant / review | 分析 / 追问 / 变式 / 复习 |
| `mastery` | 0–5 | 掌握度（0 未掌握 → 5 已掌握） |

---

## 5. 索引设计

| 集合 | 索引（字段顺序重要） | 支撑查询 |
|------|----------------------|----------|
| `mistakes` | `openid + createTime`（复合） | 首页错题列表（按时间倒序） |
| `mistakes` | `openid + subject`（复合） | 科目筛选 |
| `mistakes` | `openid + status`（复合） | 状态筛选 |
| `mistake_analyses` | `mistakeId` | 详情页按错题取分析 |
| `ai_call_logs` | `openid + createTime`（复合） | 用量/成本查询 |

> 索引规则：最左前缀原则（与 MySQL 一致）；单文档唯一性用唯一索引（如 `users.openid`）。
> 官方依据：[CloudBase 索引文档](https://docs.cloudbase.net/database/index)

---

## 6. 安全规则草案（认证接入后落库）

原则：**能交给安全规则的绝不写代码**；敏感操作走云函数。

| 集合 | 规则方向 | 说明 |
|------|----------|------|
| `users` | 仅本人读写 | `auth.openid == doc.openid` |
| `mistakes` | 客户端可增读、禁改删 | 新增/读本人才行；修改删除走云函数 |
| `mistake_analyses` | 仅本人读 | 写入仅云函数 |
| `ai_call_logs` | 完全禁客户端 | 仅云函数写 |

> 官方依据：[CloudBase 安全规则](https://docs.cloudbase.net/database/security-rules)
> 落地时机：Phase 1 认证接入时配置，此处先锁定设计方向。

---

## 7. 思维迁移：MySQL 表 → CloudBase 集合（教学对照）

| MySQL 概念 | CloudBase 对应 | 本项目实例 |
|-----------|----------------|-----------|
| 表（Table） | 集合（Collection） | `mistakes` |
| 行（Row） | 文档（Document） | 一条错题 = 一个 JSON 对象 |
| 列/类型 | 字段/类型 | `stem: string` |
| 自增主键 | `_id` 自动生成 | — |
| 外键 | 字段引用 | `mistake_analyses.mistakeId → mistakes._id` |
| JOIN | 应用层两次查询（或冗余字段） | 详情页：先查 mistakes，再按 mistakeId 查 analyses |
| 唯一约束 | 唯一索引 | `users.openid` |
| Schema 强制 | 无强校验 | 靠项目指南 + 数据模型（可选）兜底 |
| 事务 | 云函数事务 `startTransaction` | 跨集合写操作时使用 |
| 租户字段 | openid 隔离 | 所有业务集合必带 |

**关键差异提醒**：文档型数据库**没有强 Schema**——字段写错不报错。因此本项目用三重兜底：项目指南字段规范（§3）+ 云函数入参校验 + 数据模型（可选配置）。
