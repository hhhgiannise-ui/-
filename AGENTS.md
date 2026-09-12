# AGENTS.md — 项目工作规则

本文件是 AI 与协作者在本仓库内工作时必须遵守的规则。

## 硬性规则

1. **每次改动后必须创建 git commit**，禁止积压未提交的改动。
2. **每次改动后必须编写/更新相关测试**，并在交付前确保测试通过。
3. 禁止把敏感信息（密钥、Token、envId 之外的环境配置）写入代码并提交。
4. 代码保持精简：AI 生成的多余冗余代码应删除，不追求大而全。
5. 文档驱动：先有 PRD / 项目指南 / API 文档，再写代码；代码与文档保持一致。

## 提交规范

- 格式：`<type>(<scope>): <描述>`
- type：feat / fix / docs / refactor / test / chore
- 示例：`feat(auth): 完成微信一键登录` / `docs(prd): 初版 PRD 定稿`

## 目录约定

- `docs/prd/` 需求文档（PRD）
- `docs/design/` 设计文档（数据库设计等）
- `docs/api/` 接口文档
- `plans/` 开发计划与路线图；完成后归档到 `plans/Archive/`
- `for_agent/` 给 AI 的指导文档（代码规范等）
- `miniprogram/` 小程序前端代码
- `cloudfunctions/` 云函数（后端逻辑）
