# 错题追问教练（Mistake Coach）

> 代号：mistake-coach · 不告诉你答案的考研错题教练

**一句话**：拍照录入错题，AI 先做结构化分析（错因/知识点/难度），再（V2 起）用苏格拉底式追问逼你自己想通——而不是直接给答案。

## 状态

- [x] Phase 0.1 PRD
- [x] Phase 0.2 项目指南
- [x] Phase 0.3 数据库设计
- [x] Phase 0.4 API 文档
- [x] Phase 1 工程与基础设施（骨架就绪）
- [ ] Phase 2 认证：微信一键登录
- [ ] Phase 3 V1 错题录入闭环
- [ ] Phase 4 V2 追问引擎
- [ ] Phase 5 V3 变式题
- [ ] Phase 6 V4 复习调度
- [ ] Phase 7 真机预览与上架

## 技术栈

- 前端：uni-app（Vue3 + Vite），编译到微信小程序
- 后端：CloudBase 云函数（Node.js）
- 数据库/存储：CloudBase 云数据库（文档型）/ 云存储
- AI：DeepSeek / DashScope（OpenAI 兼容接口）

## 项目结构

```
├── package.json / vite.config.js   # uni-app 工程（Vue3 + Vite）
├── src/                            # 前端源码
│   ├── main.js / App.vue           # 入口（App.vue 中 wx.cloud.init）
│   ├── pages.json                  # 页面路由（对应原生 app.json）
│   ├── manifest.json               # 应用配置（小程序 appid 在此配置）
│   ├── api/index.js                # 云函数调用统一封装
│   └── pages/                      # index 列表 / add 录题 / detail 详情
├── dist/dev/mp-weixin              # 编译产物（导入微信开发者工具）
└── cloudfunctions/                 # 云函数（后端）
    └── login/                      # 微信登录（第一个云函数）
```

## 文档索引

- [PRD](docs/prd/PRD_v1.0.md)
- [项目指南](docs/design/project-guide.md)
- [数据库设计](docs/design/database-design.md)
- [API 文档](docs/design/api-design.md)
- [开发路线图](plans/roadmap.md)

## 快速开始（开发者）

1. `npm install`
2. `npm run dev:mp-weixin`（编译并监听，产物在 `dist/dev/mp-weixin`）
3. 微信开发者工具导入 `dist/dev/mp-weixin`，填入 AppID
4. `src/manifest.json` 中 `mp-weixin.appid` 填入同一 AppID
5. 开通云开发，关联环境 `cloud1-d0g4in4li4ecc7572`
6. 部署云函数：`tcb fn deploy login -e cloud1-d0g4in4li4ecc7572`（或右键开发者工具内项目上传）
