# YouMind Qiita OpenAPI Reference

This skill talks to Qiita exclusively through YouMind's OpenAPI proxy. The
end user only ever supplies a YouMind API key; the Qiita personal access
token is held server-side after the user connects Qiita inside YouMind.

Base URL: `https://youmind.com/openapi/v1` (override via `youmind.base_url`
in `~/.youmind/config.yaml` or `~/.youmind/config/youmind-qiita-article.yaml` for local dev, e.g. `http://localhost:4000/openapi/v1`).

## Authentication

Every request must carry the YouMind API key in the `x-api-key` header:

```
x-api-key: sk-ym-...
Content-Type: application/json
```

If the user has not yet linked Qiita inside YouMind, every endpoint returns
`400 QIITA_ACCOUNT_NOT_CONNECTED` with a `detail.connectUrl` pointing to
the YouMind connector settings page. Surface that URL to the user.

## Pre-conditions

1. The user has a paid YouMind plan (Pro / Max). Otherwise the proxy returns
   `402` with an `upgradeUrl` in `detail`.
2. The user has connected Qiita in YouMind ↑.

## Endpoints

All endpoints are `POST` with a JSON body. Empty body uses `{}`.

### `POST /qiita/validateConnection`

Smoke-test the linked Qiita account.

**Request body:** `{}`

**Response:**
```json
{
  "ok": true,
  "message": "Connected to Qiita as yourusername",
  "accountId": "yourusername",
  "accountName": "Your Name",
  "profileImageUrl": "https://...",
  "imageMonthlyUploadLimit": 1048576,
  "imageMonthlyUploadRemaining": 1048576
}
```

### `POST /qiita/createItem`

Create a new Qiita item. Items are published immediately; pass
`private: true` for limited sharing.

**Request body:**
```json
{
  "title": "My Awesome Article",
  "body": "# Hello\n\nMarkdown body.",
  "tags": [
    {"name": "TypeScript", "versions": []},
    {"name": "Qiita", "versions": []}
  ],
  "private": false,
  "tweet": false,
  "slide": false
}
```

`tags` accepts plain strings as well: `["typescript", "qiita"]`. Max 5 tags,
extras are dropped server-side. If `tags` is omitted the proxy injects
`[{"name": "programming", "versions": []}]` so the upstream call doesn't
fail Qiita's tag-required validation.

**Response (`QiitaItemDto`):**
```json
{
  "id": "c686397e4a0f4f11683d",
  "title": "My Awesome Article",
  "body": "# Hello\n\nMarkdown body.",
  "renderedBody": "<h1>Hello</h1>...",
  "url": "https://qiita.com/yourusername/items/c686397e4a0f4f11683d",
  "private": false,
  "tags": [{"name": "TypeScript", "versions": []}],
  "createdAt": "2026-04-15T01:02:03+09:00",
  "updatedAt": "2026-04-15T01:02:03+09:00",
  "likesCount": 0,
  "stocksCount": 0,
  "commentsCount": 0,
  "reactionsCount": 0,
  "user": {
    "id": "yourusername",
    "name": "Your Name",
    "profileImageUrl": "https://..."
  }
}
```

### `POST /qiita/updateItem`

Update an existing item. Pass only the fields to change. Toggle
visibility by setting `private` (Qiita has no separate publish/unpublish).

**Request body:**
```json
{
  "id": "c686397e4a0f4f11683d",
  "title": "Updated Title",
  "private": true
}
```

**Response:** `QiitaItemDto`

### `POST /qiita/getItem`

**Request body:** `{ "id": "<item_id>" }`
**Response:** `QiitaItemDto`

### `POST /qiita/listMyItems`

List the connected user's items.

**Request body:** `{ "page": 1, "per_page": 20 }` (both 1-100, defaults 1/20)

**Response:**
```json
{
  "items": [/* QiitaItemDto[] */],
  "total": 42,
  "page": 1,
  "perPage": 20
}
```

### `POST /qiita/deleteItem`

**Request body:** `{ "id": "<item_id>" }`
**Response:** `{ "ok": true, "id": "<item_id>" }`

## Error model

All errors use this body shape:

```json
{
  "message": "human-readable description",
  "code": "QIITA_TOKEN_INVALID",
  "detail": {
    "platform": "qiita",
    "connectUrl": "https://youmind.com/settings/connector",
    "upgradeUrl": "https://youmind.com/billing",
    "upstreamMessage": "...",
    "retryAfter": "60",
    "status": 401
  }
}
```

| HTTP | `code` | Meaning |
| --- | --- | --- |
| 400 | `QIITA_ACCOUNT_NOT_CONNECTED` | User hasn't linked Qiita yet — surface `detail.connectUrl` |
| 400 | `QIITA_TOKEN_INVALID` | Stored Qiita token rejected (401 upstream) — user should reconnect |
| 400 | `QIITA_RATE_LIMITED` | Qiita returned 429 — wait `detail.retryAfter` seconds |
| 400 | `QIITA_UPSTREAM_ERROR` | Generic Qiita-side failure — see `detail.upstreamMessage` |
| 402 | (no code) | Paid YouMind plan required — surface `upgradeUrl` |
| 403 | `QIITA_FORBIDDEN` | Caller is not the item owner |
| 404 | `QIITA_NOT_FOUND` | Item ID doesn't exist |

## Quotas

Qiita API v2 enforces 1,000 requests/hour per authenticated user. YouMind
does not add its own per-call quota. If the proxy returns
`QIITA_RATE_LIMITED`, back off using `detail.retryAfter`.

## Qiita Markdown extensions (for content authors)

Qiita supports GitHub Flavored Markdown plus the following — write your
`body` field using these directly, the platform renders them:

````markdown
# Code blocks with syntax highlighting
```python
print("hello")
```

# Math (LaTeX)
$`E = mc^2`$

```math
\sum_{i=1}^{n} x_i
```

# Note boxes
:::note info
Information note
:::

:::note warn
Warning note
:::

:::note alert
Alert/danger note
:::

# Collapsible sections
<details><summary>Click to expand</summary>
Hidden content here
</details>

# Mermaid diagrams
```mermaid
graph TD
    A --> B
```

# Task lists
- [x] Done
- [ ] Todo
````
