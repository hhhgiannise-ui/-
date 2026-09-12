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

- 前端：微信小程序（原生）
- 后端：CloudBase 云函数（Node.js）
- 数据库/存储：CloudBase 云数据库（文档型）/ 云存储
- AI：DeepSeek / DashScope（OpenAI 兼容接口）

## 项目结构

```
├── project.config.json      # 微信开发者工具项目配置
├── miniprogram/             # 小程序前端
│   ├── app.js               # 入口：wx.cloud.init
│   ├── app.json             # 全局配置（页面路由）
│   ├── api/index.js         # 云函数调用统一封装
│   └── pages/               # index 列表 / add 录题 / detail 详情
└── cloudfunctions/          # 云函数（后端）
    └── login/               # 微信登录（第一个云函数）
```

## 文档索引

- [PRD](docs/prd/PRD_v1.0.md)
- [项目指南](docs/design/project-guide.md)
- [数据库设计](docs/design/database-design.md)
- [API 文档](docs/design/api-design.md)
- [开发路线图](plans/roadmap.md)

## 快速开始（开发者）

1. 注册小程序账号获取 AppID：[mp.weixin.qq.com](https://mp.weixin.qq.com/)
2. 下载微信开发者工具：[下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
3. 导入本项目文件夹，填入 AppID
4. 开通云开发，关联环境 `my-diary-d2goz6lgh3e20a17e`
5. 部署云函数：右键 `cloudfunctions/login` → 上传并部署（云端安装依赖）
