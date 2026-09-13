# 错题追问教练（Mistake Coach）

> 代号：mistake-coach · 不告诉你答案的考研错题教练

**一句话**：录入错题，AI 先做结构化分析（错因/知识点/难度/步骤），再通过追问引导你自己想通——而不是直接给答案。

## 功能特性（已实现）

- 微信一键登录（openid 免密，自动建档）
- 错题录入（科目 + 题干，手动/OCR 来源预留）
- AI 结构化分析（DeepSeek：错因 / 知识点 / 难度 / 分步讲解），状态机防重复调用
- 错题列表（分页）+ 详情页
- **追问教练**：对已分析错题连续提问，AI 带历史上下文回答，优先引导思考、明确要答案才给解析
- 数据按 openid 隔离；AI 产出与原始错题分离存储（主/附属集合）

## 状态

- [x] Phase 0 设计四件套（PRD / 项目指南 / 数据库设计 / API 文档）
- [x] Phase 1 工程与基础设施（uni-app 骨架 + 云开发环境）
- [x] Phase 2 认证：微信一键登录
- [x] Phase 3 V1 闭环：录题 → 分析 → 列表 → 详情
- [x] Phase 3.5 追问教练（V1.1 简化版，`probe_turns`）
- [x] Phase 7 真机预览（体验版已上传并验证）
- [ ] Phase 4 V2 追问引擎进阶（S0–S5 状态机 + 流式输出）
- [ ] Phase 5 V3 变式题生成
- [ ] Phase 6 V4 复习调度
- [ ] 提审正式发布

## 技术栈

- 前端：uni-app（Vue3 + Vite），编译到微信小程序
- 后端：CloudBase 云函数（Node.js）
- 数据库：CloudBase 云数据库（文档型，5 个集合）
- AI：DeepSeek（OpenAI 兼容接口，密钥走云函数环境变量）

## 项目结构

```
├── package.json / vite.config.js    # uni-app 工程（Vue3 + Vite）
├── src/
│   ├── main.js / App.vue            # 入口（App.vue 中 wx.cloud.init）
│   ├── pages.json                   # 页面路由
│   ├── manifest.json                # 应用配置（小程序 appid）
│   ├── api/index.js                 # 云函数调用统一封装
│   └── pages/                       # index 列表 / add 录题 / detail 详情+追问
├── docs/                            # PRD / 设计 / 接口文档
├── plans/roadmap.md                 # 开发路线图
├── dist/dev/mp-weixin               # 编译产物（微信开发者工具导入用）
└── cloudfunctions/                  # 云函数（后端，6 个）
    ├── login/                       # 微信登录，users 建档
    ├── createMistake/               # 录题 → mistakes
    ├── getMistakeList/              # 列表分页
    ├── getMistakeDetail/            # 详情 + 分析 + 追问历史
    ├── analyzeMistake/              # AI 分析 → mistake_analyses
    └── askFollowup/                 # 追问教练 → probe_turns
```

## 文档索引

- [PRD](docs/prd/PRD_v1.0.md)
- [项目指南](docs/design/project-guide.md)
- [数据库设计](docs/design/database-design.md)
- [API 文档](docs/design/api-design.md)
- [开发路线图](plans/roadmap.md)
- [协作与代码约定](AGENTS.md)

## 快速开始（开发者）

1. `npm install`
2. `npm run dev:mp-weixin`（编译并监听，产物在 `dist/dev/mp-weixin`）
3. 微信开发者工具**导入仓库根目录**（`project.config.json` 已配置 `miniprogramRoot` 与 `cloudfunctionRoot`），AppID 填 `wx1929e6e943e7ce07`
4. 开通云开发，环境 ID `cloud1-d0g4in4li4ecc7572`（配置在 `src/App.vue`）
5. 云开发控制台新建集合：`users` `mistakes` `mistake_analyses` `probe_turns` `ai_call_logs`
6. 部署 6 个云函数：微信开发者工具文件树右键每个函数 →「上传并部署：云端安装依赖」
7. 给 `analyzeMistake` 和 `askFollowup` 配置环境变量 `DEEPSEEK_API_KEY`（在云函数「配置」中）
8. 编译运行，走通：登录 → 录题 → 分析 → 追问

## 上线

- 体验版：微信公众平台 → 版本管理 → 选为体验版 → 扫码真机预览
- 远程仓库：https://github.com/hhhgiannise-ui/-（main 分支）
