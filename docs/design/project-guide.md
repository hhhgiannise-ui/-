# 错题追问教练 · 项目指南（Project Guide）

> 本文档作为项目开发的**上下文锚点**。所有代码生成、文档编写请以本指南为准，保持一致。
> 版本：v1.0 · 2026-09-12 · 配套文档：[PRD](docs/prd/PRD_v1.0.md) / [数据库设计](docs/design/database-design.md) / [API 文档](docs/api/api-doc.md)

---

## 1. 项目概述

- **项目名称**：错题追问教练（Mistake Coach）
- **项目类型**：微信小程序 + 云开发（CloudBase）
- **目标用户**：开发者本人（考研自用），扩展：考研学生
- **核心目标**：不告诉答案的错题教练——录题 → AI 结构化分析 →（V2）逐层追问 →（V3）变式题 →（V4）遗忘曲线复习
- **当前范围**：V1 错题录入闭环（PRD P0 六项），V2–V4 规划中

## 2. 技术栈决策

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | 微信小程序原生（WXML/WXSS/JS） | 官方第一公民，文档最全 |
| 后端 | CloudBase 云函数（Node.js 18，CommonJS） | 免服务器/域名/备案 |
| 数据库 | CloudBase 文档型数据库（集合） | 免运维；客户端/云函数双 SDK |
| 存储 | CloudBase 云存储 | 小程序端直传，拿 fileID 即可 |
| 认证 | 微信 openid（云函数内自动获取） | 免密登录，无 JWT |
| AI | DeepSeek（OpenAI 兼容接口） | API Key 放云函数环境变量 |
| OCR | 腾讯云 OCR（通用印刷体） | 识别结果必须人工校对（数学公式不可信） |
| 异步 | 云函数内异步 + 前端轮询状态 | 避免长接口超时 |

## 3. 命名规范

### 3.1 数据库集合（小写下划线）

`users` / `mistakes` / `mistake_analyses` / `probe_sessions` / `probe_turns` / `variant_questions` / `review_schedules` / `ai_call_logs`

### 3.2 字段（小驼峰）

- 主键：`_id`（平台自动）
- 示例：`openid`、`createTime`、`subject`、`errorCause`、`knowledgeTags`
- 关联：用 `mistakeId`、`userId`（存 openid 字符串）

### 3.3 云函数（小驼峰，一个函数一个文件夹）

`login` / `createMistake` / `listMistakes` / `getMistakeDetail` / `updateMistake` / `deleteMistake` / `analyzeMistake` / `checkContent`

### 3.4 前端（页面小驼峰）

- 页面目录：`pages/mistake-list/`（含 .wxml/.wxss/.js/.json 四件套）
- 组件：`components/mistake-card/`

### 3.5 统一响应（云函数返回给前端）

```json
{ "code": 0, "message": "ok", "data": {} }
```

错误码：`0` 成功 / `401` 未登录 / `403` 越权 / `500` 服务错误

## 4. 数据模型摘要（V1 核心）

| 集合 | 用途 | 关键字段 |
|---|---|---|
| `users` | 用户档案 | openid、nickname、avatar、createTime |
| `mistakes` | 错题主集合（**只存原题**） | openid、subject、source、imageFileId、ocrText、stem、status(0待分析/1分析中/2已分析/3失败)、mastery、createTime |
| `mistake_analyses` | AI 结构化产出（**附属**） | mistakeId、knowledgeTags、errorCause、difficulty、steps、model、promptVer、createTime |
| `ai_call_logs` | AI 调用成本 | openid、bizType、model、promptTokens、outTokens、success、costCent、createTime |

（V2+：probe_sessions / probe_turns / variant_questions / review_schedules，见数据库设计文档）

**核心原则**：AI 产出永不写入 `mistakes` 主集合，原题永远可追溯。

## 5. API 接口摘要（V1）

| 云函数 | 入参（event） | 出参（data） |
|---|---|---|
| `login` | wxContext 自动取 openid | { user } 用户档案 |
| `createMistake` | subject、source、imageFileId、ocrText、stem | { mistakeId }（状态=待分析，异步触发 analyze） |
| `listMistakes` | subject?、mastery?、page、pageSize | { list, total, hasMore } |
| `getMistakeDetail` | mistakeId | { mistake, analysis } |
| `updateMistake` | mistakeId、stem、ocrText、subject | { mistake }（触发重新分析） |
| `deleteMistake` | mistakeId | { ok } |
| `analyzeMistake` | mistakeId | 触发 AI 分析（内部被 create/update 调用或定时补跑） |

## 6. 代码风格规范

- 云函数：CommonJS + `async/await`；入参 `event`，返回 `{ code, message, data }`；敏感操作先校验 openid 归属
- 前端：ES6+；页面用 `Page({})`；云函数调用统一走 `utils/request.js` 封装
- 注释：中文，只注释"为什么"，不注释"是什么"
- 日志：云函数 `console.log` 关键步骤与错误

## 7. 项目结构

```
cloudbase-miniprogram/
├── AGENTS.md                 # 项目规则
├── project.config.json       # 微信开发者工具配置
├── docs/                     # PRD / 设计 / API 文档
├── plans/                    # 路线图
├── miniprogram/              # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── index/            # 首页：错题列表
│   │   ├── add-mistake/      # 录入（拍照 + OCR + 校对）
│   │   ├── mistake-detail/   # 详情（原题 + 分析）
│   │   └── profile/          # 我的
│   ├── components/
│   └── utils/
│       ├── cloud.js          # 云开发初始化
│       └── request.js        # 云函数调用 + 统一响应处理
└── cloudfunctions/           # 云函数（一个函数一个目录）
    ├── login/
    ├── createMistake/
    ├── listMistakes/
    ├── getMistakeDetail/
    ├── updateMistake/
    ├── deleteMistake/
    └── analyzeMistake/
```

## 8. 关键决策记录

| 决策 | 选择 | 理由 |
|---|---|---|
| 后端形态 | CloudBase 云函数（非自建 Spring Boot） | 免域名备案/免运维，先跑通全流程（用户拍板） |
| 认证 | 微信 openid（云函数自动获取） | 小程序免密登录，无 JWT 复杂度 |
| 数据分离 | 主集合 + AI 附属集合 | 原题不可变、AI 可重跑可回滚 |
| 接口风格 | 全部走云函数，客户端不直连数据库 | 权限校验统一、AI 调用集中在服务端 |
| OCR | 识别 + 人工校对 | 数学公式 OCR 不可信，人工兜底闭环 |
| AI 成本 | token 落库 + 每日限额 | 防止刷接口烧钱 |
| 内容安全 | msgSecCheck 校验输入与 AI 输出 | 微信审核必查项 |
