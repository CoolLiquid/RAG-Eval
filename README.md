# 知识库测评平台

通过挂载远程 MCP 服务接入知识库，使用标准题库对 RAG 检索能力进行自动化测评。

## 文档

完整产品与技术文档见 [`doc/`](./doc/) 目录：

- [文档索引](./doc/README.md)
- [PRD 产品需求](./doc/PRD-知识库测评平台.md)
- [软件架构设计](./doc/架构设计.md)
- [MCP 接入规范](./doc/MCP接入规范.md)
- [测评引擎设计](./doc/测评引擎设计.md)
- [Stitch UI Prompts](./doc/Stitch-UI-Prompts.md)

设计资产见 [`design/`](./design/) 目录：

- [路由对照表](./design/routes.md)
- [设计 Token](./design/tokens.md)

## 核心特性

- **唯一接入方式**：远程 MCP 服务挂载
- **检索入口**：通过指定 MCP Tool（如 `kb_search`）检索知识库
- **自动化测评**：标准题库 → 批量调用 → 评分归因 → 报告

## 项目结构

```
CICD/
├── design/          # Stitch 截图、设计 token、路由对照
├── frontend/        # React + TypeScript + Ant Design
├── backend/         # FastAPI
├── doc/             # 产品与技术文档
└── docker-compose.yml
```

## 本地开发

### 前置要求

- Node.js 18+
- Python 3.11+
- Docker Desktop（用于 PostgreSQL、Redis）

### 1. 启动基础设施

```bash
docker compose up -d
```

### 2. 启动后端

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

后端 API 文档：http://localhost:8000/api/docs

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端地址：http://localhost:5173

### 验收

- 浏览器可访问全部 P0/P1 路由，侧栏导航正常
- `/login` 为独立布局（无侧栏）
- 首页「API 联调状态」显示 `后端已连接：ok (v0.1.0)`

## 状态

- [x] Phase 0：项目脚手架、路由骨架、开发环境
- [ ] Phase 1：MCP 挂载、题库、测评、报告
