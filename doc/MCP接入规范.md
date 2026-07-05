# MCP 接入规范 — 知识库测评平台

**文档版本**：v0.1  
**更新日期**：2026-07-02  
**状态**：草案  
**受众**：MCP 知识库服务接入方、平台研发

---

## 1. 概述

知识库测评平台**仅通过远程 MCP 服务**接入知识库。接入方需部署 MCP Server，并实现本规范定义的检索 Tool。平台在测评时作为 MCP Client 调用该 Tool 获取知识片段。

### 1.1 接入流程

```
1. 接入方按本规范实现 MCP Server
2. 在平台「挂载 MCP 知识库」中粘贴 JSON 配置或填写 Endpoint 与鉴权信息
3. 平台发现 Tools，选择检索 Tool（推荐 kb_search）
4. 试检索验证通过后，即可发起测评
```

---

## 2. 传输与连接

### 2.1 支持的传输方式

| 传输 | MVP | 说明 |
|------|-----|------|
| HTTP + SSE | ✅ 推荐 | 远程 MCP 标准方式 |
| Streamable HTTP | ✅ | MCP 新版本传输 |
| stdio | ❌ | 仅本地进程，平台不支持 |

### 2.2 Endpoint 格式

```
https://your-domain.com/mcp
```

或带路径：

```
https://your-domain.com/api/mcp/sse
```

### 2.3 鉴权

平台作为 MCP Client，通过 HTTP Header 向远程 MCP Server 传递鉴权信息。支持以下方式：

| 方式 | `auth_type` | 发送的 Header | 说明 |
|------|-------------|---------------|------|
| 无鉴权 | `none` | （无） | 适用于内网或公开 MCP 端点 |
| API Key（默认 Header） | `api_key` | `{Header-Name}: <key>` | 默认 Header 名为 `X-API-Key`；可通过 `auth_header_name` 自定义，如 `X-Goog-Api-Key` |
| API Key（Authorization） | `authorization_api_key` | `Authorization: ApiKey <key>` | 部分 MCP 网关使用的标准格式 |
| Bearer Token | `bearer` | `Authorization: Bearer <token>` | OAuth / JWT 等 Bearer 令牌 |
| 自定义 Header | `custom_header` | `{auth_header_name}: <key>` | 必须指定 `auth_header_name`，兼容 Cursor MCP 等第三方配置 |

> **说明**：`<key>` / `<token>` 为密钥**值**的占位符；`{Header-Name}` / `{auth_header_name}` 为 Header **名称**，需与服务端要求完全一致（如 Google Stitch 使用 `X-Goog-Api-Key`，不可与 `X-API-Key` 混用）。

接入方需在 MCP Server 侧校验鉴权，失败返回 HTTP 401。

### 2.4 平台 JSON 配置导入

挂载向导 Step 1 默认使用 **JSON 配置模式**，兼容 Cursor `mcp.json` 远程 Server 格式。也提供「高级表单」模式用于逐项编辑。

**支持的 JSON 格式**：

| 格式 | 结构 |
|------|------|
| Cursor 标准（推荐） | `{ "mcpServers": { "name": { "url", "headers?" } } }` |
| 文档 servers 写法 | `{ "servers": { "name": { "type": "http", "url", "headers?" } } }` |
| 单 server 对象 | `{ "url", "headers?" }` |

**不支持**：

| 类型 | 说明 |
|------|------|
| stdio / command | 含 `command`、`args` 且无 `url` 的配置将被拒绝 |
| OAuth `auth` 块 | MVP 暂不支持，请改用 `headers` 传递鉴权 |

**Cursor mcp.json 粘贴示例**（可直接用于平台挂载）：

```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "your-api-key"
      }
    }
  }
}
```

**环境变量占位符**：若配置含 `${env:VAR}` 等占位符，平台无法读取本机环境变量，需在「密钥覆盖」输入框中填写实际密钥后再测试连接。

**解析 API**：`POST /api/kb/parse-mcp-config`

```json
{
  "config": { "mcpServers": { "...": { "url": "...", "headers": {} } } },
  "server_name": "stitch"
}
```

多 server 时首次解析返回 `needs_server_selection: true` 与 `available_servers` 列表，指定 `server_name` 后重新解析即可。

**导出**：配置摘要卡片支持「复制 MCP 配置」，输出 Cursor 兼容 JSON（密钥脱敏）。

**Cursor 字段与内部存储映射**（解析后仍存扁平字段）：

| Cursor / JSON 字段 | 平台内部字段 |
|--------------------|--------------|
| `url` | `endpoint` |
| `headers` | 自动推断为 `auth_type` + `auth_header_name` + `auth_secret` |

**旧版 Cursor 配置映射示例**（仍支持导入）：

```json
{
  "servers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": { "X-Goog-Api-Key": "<key>" }
    }
  }
}
```

对应平台字段：

| Cursor 字段 | 平台字段 |
|-------------|----------|
| `url` | `endpoint` |
| `headers` 中的 Header 名 | `auth_type=custom_header` + `auth_header_name` |
| `headers` 中的值 | `auth_secret` |

---

## 3. 标准 Tool 契约（MVP 必实现）

### 3.1 `kb_search` — 知识库检索

**描述**：根据用户问题检索知识库，返回相关文本片段列表。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 检索问题或关键词 |
| `top_k` | integer | 否 | 返回条数，默认 5，最大 20 |

#### 请求示例

```json
{
  "query": "退货政策是什么",
  "top_k": 5
}
```

#### 响应结构

```json
{
  "results": [
    {
      "content": "自签收之日起7天内，用户可无理由申请退货...",
      "source": "doc://after-sales-policy/v2.3#section-3",
      "title": "售后政策 - 退货条款",
      "score": 0.92
    },
    {
      "content": "特殊商品（定制类）不支持无理由退货...",
      "source": "doc://after-sales-policy/v2.3#section-5",
      "title": "售后政策 - 例外情况",
      "score": 0.78
    }
  ]
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `results` | array | 是 | 检索结果列表，无结果时返回空数组 `[]` |
| `results[].content` | string | 是 | 文本片段，建议 100–2000 字符 |
| `results[].source` | string | 是 | 来源唯一标识（URI、文档 ID、路径均可） |
| `results[].title` | string | 否 | 来源标题 |
| `results[].score` | number | 否 | 相关度分数 0–1，越高越相关 |

#### 错误响应

Tool 执行失败时，返回 MCP 标准错误：

```json
{
  "error": {
    "code": "SEARCH_FAILED",
    "message": "Index not ready"
  }
}
```

平台将此类错误标记为 `mcp_error`。

---

### 3.2 `kb_health` — 健康检查（可选）

**描述**：用于平台连接测试，检查 MCP 知识库服务是否就绪。

#### 请求参数

无，或空对象 `{}`。

#### 响应结构

```json
{
  "status": "ok",
  "index_ready": true,
  "document_count": 1284,
  "version": "2.3.0"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | `ok` 或 `degraded` 或 `error` |
| `index_ready` | boolean | 索引是否可用于检索 |
| `document_count` | integer | 可选，文档数量 |
| `version` | string | 可选，知识库版本号 |

---

## 4. Tool 发现

平台连接 MCP Server 后，调用 MCP `tools/list` 获取可用 Tool 列表。

接入方应确保：

- `kb_search` 在 Tool 列表中可见
- Tool 的 `inputSchema` 正确描述 `query` 和 `top_k`
- Tool 的 `description` 清晰，便于用户在平台 UI 中选择

**inputSchema 示例**：

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "检索问题"
    },
    "top_k": {
      "type": "integer",
      "description": "返回条数",
      "default": 5,
      "minimum": 1,
      "maximum": 20
    }
  },
  "required": ["query"]
}
```

---

## 5. 灵活 Tool 映射（V1.1）

若接入方已有异构 Tool（如 `search_docs`、`fetch_docs`），无法实现标准 `kb_search`，可在平台配置映射。

### 5.1 入参映射

| 平台标准字段 | 映射到 MCP 字段 | 示例 |
|--------------|-----------------|------|
| `query` | `question` / `q` / `search_text` | `question` |
| `top_k` | `limit` / `count` / `n` | `limit` |

### 5.2 响应映射

| 平台标准字段 | JSON 路径 | 示例 |
|--------------|-----------|------|
| results 数组 | `$.data.chunks` | 结果在 `data.chunks` |
| content | `$.text` / `$.snippet` | 每条结果的文本字段 |
| source | `$.doc_id` / `$.url` | 来源字段 |
| score | `$.similarity` / `$.relevance` | 分数字段 |

### 5.3 映射配置示例

```json
{
  "tool_name": "search_docs",
  "input_mapping": {
    "query": "question",
    "top_k": "limit"
  },
  "output_mapping": {
    "results_path": "$.data.items",
    "content_field": "snippet",
    "source_field": "doc_id",
    "score_field": "similarity"
  }
}
```

---

## 6. 平台侧归一化结构

无论 MCP 返回何种格式，平台 Adapter 统一转换为：

```typescript
interface Chunk {
  content: string;       // 必填
  source: string;        // 必填
  title?: string;
  score?: number;        // 0-1
}

interface RetrievalResult {
  chunks: Chunk[];
  raw_response: object;  // 原始 MCP 响应，用于审计
  latency_ms: number;
  tool_name: string;
  request_params: object;
}
```

---

## 7. 性能与 SLA 建议

| 指标 | 建议值 | 说明 |
|------|--------|------|
| 单次 kb_search 延迟 | P95 < 3s | 100 题测评总时长依赖此指标 |
| 超时 | 平台默认 30s | 超时标记 mcp_error |
| 并发 | 支持平台 3–5 并发调用 | Worker 可配置并发度 |
| 空结果 | 返回 `results: []` | 不要报错，由平台判定 no_recall |

---

## 8. 错误码约定

| 错误码 | HTTP/MCP | 平台处理 | 用户提示 |
|--------|----------|----------|----------|
| `AUTH_FAILED` | 401 | 连接失败 | 请检查 API Key |
| `TOOL_NOT_FOUND` | — | 配置错误 | 检索 Tool 不存在 |
| `SEARCH_FAILED` | — | mcp_error | 检索服务异常 |
| `INDEX_NOT_READY` | — | mcp_error | 知识库索引未就绪 |
| `TIMEOUT` | — | mcp_error | 检索超时，请稍后重试 |
| `INVALID_QUERY` | — | mcp_error | 查询参数无效 |

---

## 9. 接入自检清单

接入方上线前请确认：

- [ ] MCP Server 可通过 HTTPS 公网访问（或平台可访问的内网地址）
- [ ] 鉴权机制已实现并测试
- [ ] `kb_search` Tool 已注册且 `tools/list` 可见
- [ ] 空 query 有合理错误处理
- [ ] 无结果时返回 `results: []` 而非报错
- [ ] 单次检索 P95 < 3s
- [ ] `content` 不为空字符串（有效片段）
- [ ] `source` 全局唯一，便于报告追溯
- [ ] （可选）`kb_health` 已实现

---

## 10. 参考实现伪代码

```python
# MCP Server 侧 — kb_search Tool 示例

@mcp.tool()
def kb_search(query: str, top_k: int = 5) -> dict:
    if not query or not query.strip():
        raise ToolError("INVALID_QUERY", "query is required")

    chunks = vector_store.search(query, top_k=min(top_k, 20))

    return {
        "results": [
            {
                "content": c.text,
                "source": c.doc_id,
                "title": c.title,
                "score": c.score,
            }
            for c in chunks
        ]
    }


@mcp.tool()
def kb_health() -> dict:
    return {
        "status": "ok" if index.is_ready else "error",
        "index_ready": index.is_ready,
        "document_count": index.count(),
        "version": "1.0.0",
    }
```

---

## 11. 常见问题

**Q: 平台会缓存 MCP 检索结果吗？**  
A: 仅在单次测评任务内用于报告展示，不做长期缓存。每次测评重新调用 MCP。

**Q: 是否支持流式返回？**  
A: MVP 不支持。`kb_search` 应返回完整 JSON 结果。

**Q: 一个 MCP Server 可以挂载多个知识库吗？**  
A: 可以。接入方可通过不同 Tool 或 Tool 参数（如 `collection_id`）区分，平台侧创建多个 MCP 知识库实例分别配置。

**Q: 检索 Tool 需要支持生成回答吗？**  
A: 不需要。生成由平台侧 LLM 完成（RAG 全链路模式）。MCP 仅负责检索片段。

---

## 12. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-07-02 | 初版：kb_search / kb_health 契约、映射规范 |
