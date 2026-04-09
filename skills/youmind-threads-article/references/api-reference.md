# YouMind Threads Proxy API Reference

> **重要**：Skill 代码**绝不直接调用** `graph.threads.net`。所有 Threads 操作通过 YouMind
> 平台的 `/threads/*` 代理端点完成。YouMind 服务端持有用户的 long-lived Meta token 并
> 自动刷新；skill 只需要一个 YouMind API key。
>
> **当前状态**：`/threads/*` 端点尚未在 YouMind 服务端实现，skill 侧使用 mock
> （见 `toolkit/src/threads-api.ts` 顶部注释）。本文档描述的是**契约形态**，YouMind
> 服务端实现时应对齐此形态；skill 侧只需替换 `threads-api.ts` 中各函数体即可。

## 基础信息

- **Base URL**: `https://youmind.com/openapi/v1`
- **鉴权**: HTTP header `x-api-key: <youmind_api_key>`
- **Content-Type**: `application/json`
- **HTTP method**: 所有 Threads 端点都是 `POST`（和现有 `/search`、`/webSearch` 保持一致）

## 端点总览

| 端点 | 作用 |
| --- | --- |
| `/threads/status` | 查询用户是否已在 YouMind 绑定 Threads |
| `/threads/limits` | 查询 24h 滚动窗口的发布/回复配额 |
| `/threads/createContainer` | 创建一个 Threads container（草稿） |
| `/threads/publishContainer` | 发布一个已创建的 container |
| `/threads/listPosts` | 列出最近发布的帖子 |

## POST `/threads/status`

查询当前 YouMind 用户的 Threads 绑定状态。

**Request body**: `{}`

**Response**:
```json
{
  "bound": true,
  "username": "dongdongbear",
  "expires_at": "2026-06-09T00:00:00Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `bound` | boolean | 是否已绑定 |
| `username` | string? | 绑定的 Threads 用户名（bound=true 时） |
| `expires_at` | ISO 8601? | Token 过期时间；剩余 <7 天时 skill 应提醒用户重新授权 |

## POST `/threads/limits`

返回当前用户 24 小时滚动窗口的剩余配额。

**Request body**: `{}`

**Response**:
```json
{
  "quota_posts_remaining": 237,
  "quota_replies_remaining": 984,
  "reset_at": "2026-04-10T15:30:00Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `quota_posts_remaining` | int | 发布配额剩余（上限 250） |
| `quota_replies_remaining` | int | 回复配额剩余（上限 1000） |
| `reset_at` | ISO 8601 | 窗口滚动到下一次 "clear" 的时间 |

## POST `/threads/createContainer`

创建一个 Threads container。Container 必须在约 15 分钟内通过 `publishContainer` 发布，否则会过期。

**Request body**:
```json
{
  "text": "Hello Threads!",
  "media_type": "TEXT",
  "image_url": null,
  "video_url": null,
  "reply_to_id": null
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `text` | string | 是 | 段文本，≤500 chars |
| `media_type` | "TEXT" / "IMAGE" / "VIDEO" | 是 | 媒体类型 |
| `image_url` | string | media_type=IMAGE 时必填 | 图片 URL |
| `video_url` | string | media_type=VIDEO 时必填 | 视频 URL |
| `reply_to_id` | string | 否 | 若设置，此 container 作为对该帖子的回复 |

**Response**:
```json
{ "container_id": "18028_abc_def" }
```

## POST `/threads/publishContainer`

发布一个已创建的 container。

**Request body**:
```json
{ "container_id": "18028_abc_def" }
```

**Response**:
```json
{
  "id": "18028123456789",
  "permalink": "https://www.threads.net/@dongdongbear/post/CxYz0abc"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Threads 帖子 id（作为下一段 `reply_to_id` 用） |
| `permalink` | string | 对外可见链接 |

## POST `/threads/listPosts`

列出最近发布的帖子。

**Request body**:
```json
{ "limit": 10 }
```

**Response**:
```json
{
  "data": [
    {
      "id": "18028...",
      "permalink": "https://www.threads.net/@...",
      "text": "Hello",
      "created_time": "2026-04-09T15:30:00Z"
    }
  ]
}
```

## 错误响应

所有端点在失败时返回非 200 HTTP 状态码，body 是 YouMind 的标准错误格式：

```json
{
  "error": "Threads binding expired",
  "code": "THREADS_TOKEN_EXPIRED"
}
```

常见错误：

| 状态 | 原因 | Skill 处理 |
| --- | --- | --- |
| 401 | YouMind API key 无效 | CLI 报错退出，提示检查 config.yaml |
| 403 | Threads 未绑定 | `status.bound=false`，返回 upsell（而不是 throw） |
| 409 | Threads 配额耗尽 | 读 `getPublishingLimits`，报 reset 时间 |
| 429 | 通用 rate limit | 报错，提示重试时间 |
| 500 | YouMind 服务端故障 | 报错，保留草稿 |

## 契约变更约定

**本文档中的端点是本 skill 对 YouMind 服务端的假设**。YouMind 实际实现时字段命名或语义可能调整。若发生变更：

- 只需要改 `skills/youmind-threads-article/toolkit/src/threads-api.ts` 一个文件
- `publisher.ts`、`cli.ts`、`content-adapter.ts` 不感知
- `references/*.md` 里的对外描述也要同步更新

## 为什么不直接调 Meta

spec 明确规定：skill **禁止**直接访问 `graph.threads.net`。原因：

1. **OAuth 摩擦**：每个 skill 都要求用户手动申请 Meta app、拿 long-lived token、每 60 天手动刷新——这是现有 article skill 采用率低的主要原因之一
2. **Token 轮转**：Meta 的 token 60 天一次 refresh，skill 层的轮转逻辑会写 11 遍
3. **App-level rate limit**：Meta Graph API 对每个 app 有整体的 rate limit；由 YouMind 作为平台统一管理，比每个 skill 各自申请提额更有效
4. **合规**：Threads API 要求 Meta App 开启 "Threads API use case"，这是一个平台级的合规决定

所有上述复杂度由 YouMind 服务端承担，skill 只需要一个 `x-api-key` 就能发布到任何用户绑定的 Threads 账号。
