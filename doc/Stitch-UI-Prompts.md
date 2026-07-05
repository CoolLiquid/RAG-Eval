# Google Stitch UI Prompts — 知识库测评平台

**文档版本**：v0.1  
**更新日期**：2026-07-02  
**来源**：[PRD-知识库测评平台.md](./PRD-知识库测评平台.md)  
**目标平台**：[Google Stitch](https://stitch.withgoogle.com)

---

## 使用说明

1. 在 Stitch 中新建项目，先粘贴 **全局设计系统 prompt** 建立统一视觉语言。
2. 再依次生成各页面 prompt（建议从 **应用主框架** 开始）。
3. 迭代时用 Stitch 对话微调，例如：「把失败归因标签改成红色系 pill badge」。

> Prompt 格式遵循 Stitch 官方 **Anatomy（结构）+ Vibe（风格）+ Content（内容）** 三层框架。  
> 每个 prompt 为可直接粘贴的纯文本块，不含 Markdown 标题。

---

## 0. 全局设计系统（Project Theme）

```text
Design a unified design system for a Chinese B2B SaaS web application called "知识库测评平台" — an enterprise tool for evaluating remote MCP knowledge base retrieval quality through automated test suites and scoring reports.

Include:
- Platform: Desktop web, 1280px minimum width, Chinese (Simplified) UI labels throughout
- Color palette: Primary Indigo (#4F46E5) for CTAs and active nav; Success Green (#16A34A) for pass/connected; Warning Amber (#D97706) for pending/running; Error Red (#DC2626) for fail/disconnected; Neutral backgrounds Slate-50 (#F8FAFC) page, White (#FFFFFF) cards, Slate-200 (#E2E8F0) borders, Slate-700 (#334155) body text, Slate-900 (#0F172A) headings
- Typography: Modern sans-serif (Inter or Noto Sans SC feel), 14px body, 12px secondary/meta, semibold section titles
- Components: Rounded-lg cards with subtle shadow; pill status badges; data tables with zebra hover; step wizard indicator; progress bars; collapsible JSON evidence panels; KPI stat cards in 3-column grid; primary filled buttons, secondary outline buttons, ghost icon buttons
- Data visualization: horizontal bar for category score distribution; donut or ring for pass rate; latency shown as ms suffix

Style: Clean professional SaaS, trustworthy and analytical, information-dense but breathable, Ant Design / Linear-inspired admin dashboard, subtle elevation, 8px spacing grid, high contrast for accessibility.

Optimize for: Desktop-first admin workflows, WCAG AA contrast, keyboard-friendly forms, scannable tables with sticky headers.
```

---

## 1. 应用主框架（App Shell / Layout）

**路由**：全局 Layout

```text
Design a desktop web admin layout shell for "知识库测评平台" — MCP knowledge base evaluation platform with left sidebar navigation and top header.

Include:
- Fixed left sidebar (240px): product logo "KB Eval" with subtitle "知识库测评", nav items with icons — 首页概览, MCP 知识库, 测评题库, 测评任务, 系统设置; active item highlighted with indigo left border and light indigo background
- Top header bar: breadcrumb trail (e.g. MCP 知识库 / 挂载向导), global search placeholder "搜索知识库或任务...", notification bell icon, user avatar dropdown "管理员"
- Main content area: white card container on slate-50 background with 24px padding, scrollable
- Optional compact mode: sidebar collapses to icon-only

Style: Clean B2B SaaS, indigo accent, white sidebar or light gray sidebar variant, professional Chinese enterprise admin, subtle dividers, 8px grid spacing.

Optimize for: 1280px+ desktop, persistent navigation across all inner pages, clear visual hierarchy between global chrome and page content.
```

---

## 2. 登录页

**路由**：`/login` · **优先级**：P0

```text
Design a centered login screen for "知识库测评平台" — enterprise MCP knowledge base evaluation tool. Chinese UI.

Include:
- Split layout: left panel (40%) with indigo gradient background, product illustration of connected knowledge nodes and MCP protocol lines, headline "量化你的知识库检索质量", subtext "挂载 MCP · 标准题库 · 自动化测评 · 可归因报告"
- Right panel (60%): white login card with logo, title "登录", email/username field placeholder "账号", password field with show/hide toggle, primary button "登录", subtle footer "MVP 单用户模式"
- Minimal distractions, no sidebar

Style: Professional trustworthy SaaS, indigo primary, clean form fields with focus ring, modern sans-serif Chinese labels.

Optimize for: Desktop 1280px, accessible form labels, high contrast inputs.
```

---

## 3. 首页概览

**路由**：`/dashboard` · **优先级**：P1

```text
Design a dashboard overview page for "知识库测评平台" inside the admin shell. Chinese UI with sample data.

Include:
- Page title "首页概览" with subtitle "MCP 知识库测评运行状态一览"
- Top KPI row (3 cards): "MCP 知识库" value 5 with +1 badge, "进行中任务" value 2 with amber pulse dot, "最近平均得分" value 78.5 with green up arrow
- Quick action row: two prominent buttons "挂载 MCP 知识库" (primary) and "发起测评" (secondary)
- Recent evaluations table: columns 任务名称, MCP 知识库, 题库, 状态 (completed/running/failed badges), 综合得分, 通过率, 创建时间, 操作 "查看报告"; 5 sample rows with Chinese names like "售后政策回归测评", "产品FAQ v2对比"
- Empty-state hint area if no data: illustration + "尚未发起测评，从挂载 MCP 开始"

Style: Data-forward admin dashboard, indigo accents, green/amber/red status pills, card-based KPI metrics, scannable table.

Optimize for: At-a-glance operational awareness, desktop 1280px+, sticky table header on scroll.
```

---

## 4. MCP 知识库列表

**路由**：`/knowledge-bases` · **优先级**：P0

```text
Design an MCP knowledge base management list page for "知识库测评平台". Chinese B2B admin table view.

Include:
- Page header: title "MCP 知识库", description "管理已挂载的远程 MCP 知识库实例", primary button "+ 挂载 MCP 知识库" top-right
- Filter bar: search input "搜索名称或 Endpoint", status filter dropdown (全部/已连接/连接失败/待配置/已禁用), refresh icon button
- Data table columns: 名称, Endpoint (truncated monospace URL), 检索 Tool (badge e.g. kb_search), 连接状态 (green 已连接 / red 连接失败 / gray 待配置 / slate 已禁用), 最近测试时间, 操作 (编辑, 测试连接, 试检索, 发起测评, 删除 as icon+text links)
- Sample rows: "售后知识库" https://mcp.example.com/sales status 已连接; "产品文档库" status 连接失败 with red tooltip hint
- Pagination footer: "共 12 条" with page controls

Style: Clean enterprise data table, monospace for URLs, color-coded connection status badges, indigo primary actions.

Optimize for: Dense but readable table, quick scan of connection health, desktop admin workflow.
```

---

## 5. 挂载 MCP 向导（4 步）

**路由**：`/knowledge-bases/new` · **优先级**：P0

```text
Design a 4-step wizard page for mounting a remote MCP knowledge base in "知识库测评平台". Chinese UI, currently on Step 3 of 4.

Include:
- Page title "挂载 MCP 知识库" with horizontal step indicator: ① 连接 → ② 选择 Tool → ③ 试检索 (active) → ④ 保存; completed steps show green checkmarks
- Step 3 panel card titled "试检索": helper text "输入测试问题，预览 MCP 返回的知识片段"
- Test query input pre-filled "退货政策是什么", primary button "执行试检索", secondary "上一步"
- Results preview area below: 3 chunk cards each showing content snippet, source document title, relevance score (0.92, 0.87, 0.71); empty state variant "调用成功，返回 0 条结果" in neutral gray box
- Right-side sticky summary card: 名称 "售后知识库", Endpoint truncated, Tool "kb_search", auth "API Key ·••••••" masked, button "下一步：保存"

Style: Guided wizard flow, clear step progression, card-based retrieval preview, professional form layout, indigo active step.

Optimize for: Linear onboarding UX, visible progress, safe credential display (masked keys only), desktop 1280px.
```

### Step 1 补充迭代 prompt

```text
Update the MCP mount wizard Step 1:
- 名称 input
- Config mode toggle: "JSON 配置" (default) | "高级表单"
- JSON mode: monospace textarea for Cursor mcp.json format (mcpServers + url + headers), buttons "解析配置" and "复制为标准 JSON", helper text "仅支持远程 url，不支持 command/stdio"
- Multi-server Select when mcp.json contains multiple mcpServers entries
- Secret override password field when config contains ${env:VAR} placeholders
- Form mode: MCP Endpoint URL, auth type select, optional custom header name, masked secret password with note "密钥不在前端明文展示"
- Primary button "测试连接并继续"
- Right summary card with "复制 MCP 配置" button (masked export)
Show inline validation for invalid JSON and stdio rejection errors.
```

---

## 6. 题库管理

**路由**：`/question-banks` · **优先级**：P0

```text
Design a question bank management page for "知识库测评平台" evaluation test suites. Chinese admin UI.

Include:
- Page header: title "测评题库", tabs "内置题库" (active) and "自定义题库"
- Built-in bank cards grid (2 columns): card "售后政策演示题库" with tag 内置, 50 题, categories 售后政策/退换货/保修, button "预览题目"; card "产品 FAQ 演示题库" 30 题
- Custom bank section: upload zone "拖拽 CSV 或点击上传" with format hint "question, expected_answer, category, difficulty, source_ref", download template link
- Expandable preview table for selected bank: columns 问题, 期望答案 (truncated), 类目, 难度 (easy/medium/hard colored pills), 来源引用; sample row "退货政策是什么" / "7天内可无理由退货" / 售后政策 / easy / 售后手册第3章
- Actions: "使用该题库发起测评" primary button

Style: Card grid + data table hybrid, difficulty color coding (green/yellow/red), clean CSV import dropzone with dashed border.

Optimize for: Easy bank selection before evaluation, readable question preview, desktop workflow.
```

---

## 7. 创建测评

**路由**：`/evaluations/new` · **优先级**：P0

```text
Design a create evaluation task form page for "知识库测评平台". Chinese B2B configuration UI.

Include:
- Page title "创建测评任务" with breadcrumb 测评任务 / 新建
- Two-column form layout in white card:
  Left column — basic config: 任务名称 text input placeholder "例：售后政策 v1.2 回归"; MCP 知识库 dropdown "售后知识库 (已连接)"; 测评题库 dropdown "售后政策演示题库 (50题)"
  Right column — advanced params: 测评模式 segmented control "检索测评 retrieval_only" selected (rag_full grayed as coming soon); top_k number input default 5; 通过阈值 slider 70; 评分方式 radio "LLM 裁判" selected vs "语义相似度"; LLM 配置 collapsed section "使用系统默认模型"
- Bottom action bar sticky: "取消" ghost, "创建并开始测评" primary indigo button
- Inline help tooltips explaining retrieval_only evaluates MCP chunks without LLM generation

Style: Structured settings form, segmented controls, slider with value label, professional config panel feel like CI/CD pipeline setup.

Optimize for: Clear parameter defaults visible, minimal clicks to start evaluation, desktop 1280px two-column layout.
```

---

## 8. 测评进行中

**路由**：`/evaluations/:id/running` · **优先级**：P0

```text
Design an evaluation task progress page for "知识库测评平台" showing async batch execution. Chinese UI with live progress feel.

Include:
- Page header: task name "售后政策回归测评", status badge "运行中" with amber animated pulse, secondary button "取消任务" outline red
- Progress section: large progress bar 36/50 (72%), text "正在执行第 36 题...", estimated remaining "约 3 分钟"
- Live log panel (monospace, scrollable, max-height 240px): timestamped lines "✓ Q35 MCP 调用 1.2s 得分 85 通过", "✗ Q34 未召回相关片段 no_recall", "⏳ Q36 调用 kb_search..."
- Summary mini-stats row: 已通过 28, 未通过 6, MCP 错误 1, 平均延迟 1.8s
- Disabled preview link "完成后查看完整报告"

Style: Real-time ops monitoring aesthetic, progress-centric, terminal-style log with color-coded pass/fail lines, amber running state.

Optimize for: User confidence during long batch jobs, clear cancel affordance, desktop admin monitoring view.
```

---

## 9. 测评报告（核心页）

**路由**：`/evaluations/:id/report` · **优先级**：P0

```text
Design a comprehensive evaluation report page for "知识库测评平台" — the primary deliverable showing scores, failure attribution, and MCP call evidence. Chinese UI with rich data.

Include:
- Report header: title "售后政策回归测评 报告", meta row "MCP: 售后知识库 · 题库: 50题 · 模式: 检索测评 · 完成于 2026-07-02 14:32", actions "导出 PDF" (disabled V1.1 tag), "导出 Excel" (disabled), "重新测评" secondary
- Overview KPI grid (4 cards): 综合得分 78.5/100 large number, 通过率 72% with green ring chart, 平均 MCP 延迟 1.6s, 失败题数 14 with breakdown pills mcp_error 2, no_recall 6, wrong_answer 4, incomplete 2
- Category score bar chart section "按类目得分": horizontal bars 售后政策 85%, 退换货 70%, 保修 62%
- Question detail list (expandable accordion rows):
  Collapsed row: Q1 "退货政策是什么" — 得分 92 — green 通过 badge
  Expanded row shows: 期望答案 "7天内可无理由退货"; 检索片段 list (2 chunks with content/source/score); MCP 调用证据 collapsible JSON block showing tool kb_search, params {query, top_k:5}, latency 980ms; 失败类型 empty for pass
  Failed row example: Q12 score 35 red 未通过, failure type pill "no_recall" with definition tooltip "调用成功但未召回相关片段"
- Top filter bar above list: 全部/通过/未通过 toggle, failure type filter dropdown, search questions

Style: Analytical report dashboard, strong pass/fail color semantics, evidence-first debugging layout, collapsible technical details for MCP audit trail, data-dense but sectioned.

Optimize for: User can identify Top 3 failure reasons within 5 minutes, desktop 1280px+, sticky overview KPIs while scrolling question list.
```

### 报告页迭代 refinement prompt

```text
Update the evaluation report page: make failure type pills use distinct colors — no_recall amber, wrong_answer red, mcp_error purple, incomplete blue; add a sticky right-side summary panel showing "Top 3 失败原因" ranked list; keep Chinese labels and indigo SaaS style.
```

---

## 10. 系统设置

**路由**：`/settings` · **优先级**：P2（MVP 简化）

```text
Design a simplified system settings page for "知识库测评平台". Chinese admin settings UI.

Include:
- Page title "系统设置" with vertical tab nav: LLM 配置 (active), 默认测评参数, 账号
- LLM 配置 panel: API Base URL input, API Key masked input, 模型名称 dropdown "gpt-4o-mini", test connection button "测试 LLM 连接", success toast state
- 默认测评参数 panel (secondary tab preview): top_k default 5, 通过阈值 70, 单题超时 30s, 评分方式 LLM 裁判
- Save bar: "保存设置" primary button, last saved timestamp

Style: Minimal settings form, same indigo SaaS system, grouped field sections with descriptions.

Optimize for: Single-admin MVP setup, clear separation of LLM vs evaluation defaults, desktop form layout.
```

---

## PRD 对照表

| PRD 要求 | Prompt 中的体现 |
|---------|----------------|
| 中文界面、1280px+ 桌面 Web | 全局与各页均标注 Chinese UI、Desktop-first |
| MCP 挂载 4 步向导 | 独立 wizard prompt，含试检索 chunk 预览 |
| 连接状态四态 | 列表页 status badge 颜色语义 |
| 测评模式 retrieval_only MVP | 创建页 segmented control，rag_full 置灰 |
| 报告：得分、归因、MCP 证据 | 报告页 KPI + 失败类型 pill + 可折叠 JSON |
| 密钥不明文展示 | 向导摘要与设置页 masked 字段 |
| B 端表格/表单场景 | Ant Design 风格、数据表格、KPI 卡片 |

---

## 页面清单与 prompt 索引

| 优先级 | 页面 | 路由 | 本文档章节 |
|--------|------|------|-----------|
| P0 | 登录 | `/login` | §2 |
| P0 | MCP 知识库列表 | `/knowledge-bases` | §4 |
| P0 | 挂载 MCP 向导 | `/knowledge-bases/new` | §5 |
| P0 | 题库管理 | `/question-banks` | §6 |
| P0 | 创建测评 | `/evaluations/new` | §7 |
| P0 | 测评进行中 | `/evaluations/:id/running` | §8 |
| P0 | 测评报告 | `/evaluations/:id/report` | §9 |
| P1 | 首页概览 | `/dashboard` | §3 |
| P1 | 测评任务列表 | `/evaluations` | 可复用 §3 表格样式 |
| P1 | 版本对比 | `/evaluations/compare` | V1.1，待补充 |
| P2 | 系统设置 | `/settings` | §10 |
