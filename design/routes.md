# 页面-路由-组件-API 对照表

| 页面名 | 路由 | 前端组件 | 后端 API（待实现） |
|--------|------|----------|-------------------|
| 登录 | `/login` | `LoginPage` | — |
| 首页概览 | `/dashboard` | `DashboardPage` | — |
| MCP 知识库列表 | `/knowledge-bases` | `KBListPage` | `GET /api/kb` |
| 挂载 MCP 向导 | `/knowledge-bases/new` | `KBWizardPage` | `POST /api/kb`, `POST /api/kb/{id}/test-connection`, `POST /api/kb/{id}/discover-tools`, `POST /api/kb/{id}/trial-search` |
| 题库管理 | `/question-banks` | `QuestionBankPage` | `GET /api/question-banks`, `POST /api/question-banks/import` |
| 测评任务列表 | `/evaluations` | `EvaluationListPage` | `GET /api/evaluations` |
| 创建测评 | `/evaluations/new` | `CreateEvaluationPage` | `POST /api/evaluations` |
| 测评进行中 | `/evaluations/:id/running` | `EvaluationRunningPage` | `GET /api/evaluations/{id}` |
| 测评报告 | `/evaluations/:id/report` | `EvaluationReportPage` | `GET /api/evaluations/{id}/report` |
| 版本对比 | `/evaluations/compare` | `EvaluationComparePage` | V1.1 |
| 系统设置 | `/settings` | `SettingsPage` | V1.1 |

## Stitch 截图对照

将 Stitch 导出的页面截图放入 [`screens/`](./screens/) 目录，命名建议：

```
login.png
dashboard.png
knowledge-bases-list.png
knowledge-bases-wizard.png
question-banks.png
evaluations-new.png
evaluations-running.png
evaluations-report.png
settings.png
```

## Phase 推进勾选

- [x] Phase 0：路由骨架 + AppShell
- [ ] Phase 1a：MCP 知识库挂载
- [x] Phase 1b：题库 CSV 导入
- [ ] Phase 1c：测评执行 + 报告
