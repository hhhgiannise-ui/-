# 错题追问教练 · 开发路线图（v1.0）

> 产品名：错题追问教练 · 代号：mistake-coach
> 定位：不告诉你答案的考研错题教练（自用 + 作品集）
> 技术栈：微信小程序（原生）+ CloudBase 云开发（云函数 Node.js / 云数据库 / 云存储）

## 阶段总览

```
Phase 0 需求与设计（文档先行）
  ├─ 0.1 PRD（docs/prd/PRD_v1.0.md）✅
  ├─ 0.2 项目指南（docs/design/project-guide.md）
  ├─ 0.3 数据库设计（docs/design/database-design.md）
  └─ 0.4 API 接口文档（docs/api/api-doc.md）

Phase 1 工程与基础设施
  ├─ 1.1 微信开发者工具创建小程序 + 开通/绑定云开发环境
  ├─ 1.2 CloudBase SDK 接入 + miniprogram/ 与 cloudfunctions/ 骨架
  └─ 1.3 Git 远程仓库推送（GitHub/Gitee）

Phase 2 认证：微信一键登录
  ├─ 2.1 云开发开通微信登录能力
  ├─ 2.2 登录云函数（openid → 用户集合 upsert）
  └─ 2.3 前端登录态管理

Phase 3 V1 错题录入闭环（对应 PRD P0）
  ├─ 3.1 拍照/相册选图 → 云存储直传
  ├─ 3.2 错题录入（题干/科目/来源/OCR 人工校对）
  ├─ 3.3 云函数 analyzeMistake：调大模型结构化分析
  ├─ 3.4 错题列表（筛选+分页）+ 详情页
  └─ 3.5 内容安全校验（msgSecCheck）

Phase 4 V2 追问引擎（对应 PRD P1）
  ├─ 4.1 S0–S5 追问状态机 + 多轮会话
  └─ 4.2 SSE 流式输出（enableChunked）

Phase 5 V3 变式题生成（对应 PRD P2）
  └─ 5.1 生成 + 三重校验（结构/独立求解/相似度去重）

Phase 6 V4 复习调度（对应 PRD P2）
  ├─ 6.1 简化 SM-2 调度
  ├─ 6.2 云函数定时触发器 + 订阅消息 + 首页红点
  └─ 6.3 统计看板（错因分布/知识点弱项/放弃率）

Phase 7 真机预览与上架
  ├─ 7.1 全流程自测
  ├─ 7.2 真机预览体验（个人小程序账号）
  └─ 7.3 （可选）提审上架：类目/隐私协议/内容安全
```

## 关键决策（预记）

| 决策点 | 倾向方案 | 理由 |
|---|---|---|
| 前端 | 微信小程序原生（WXML/WXSS/JS） | 官方第一公民，文档最全 |
| 后端 | CloudBase 云函数（Node.js） | 免服务器免域名免备案，最快跑通全流程 |
| 数据库 | CloudBase 文档型数据库 | 免运维，与小程序 SDK 天然集成 |
| 存储 | CloudBase 云存储 | 小程序端直传，无需临时密钥 |
| 认证 | 微信开放能力（openid） | 免密登录，云开发原生支持 |
| AI 能力 | DeepSeek / DashScope（OpenAI 兼容接口） | 已有 Key，云函数直接调用 |
| 分析架构 | 主集合存原题 + 附属集合存 AI 产出 | 原题可追溯、AI 结果可重跑 |
| 异步 | 云函数异步处理 + 前端轮询状态 | 避免长接口超时 |

## 进度跟踪

- [x] Phase 0.1 PRD
- [ ] Phase 0.2 项目指南
- [ ] Phase 0.3 数据库设计
- [ ] Phase 0.4 API 文档
- [ ] Phase 1 工程与基础设施
- [ ] Phase 2 认证
- [ ] Phase 3 V1 录入闭环
- [ ] Phase 4 V2 追问引擎
- [ ] Phase 5 V3 变式题
- [ ] Phase 6 V4 复习调度
- [ ] Phase 7 真机预览
