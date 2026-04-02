# Qiita API v2 Reference

Base URL: `https://qiita.com/api/v2`

Full API docs: https://qiita.com/api/v2/docs

## Authentication

All requests require the `Authorization` header with a Bearer token:

```
Authorization: Bearer YOUR_QIITA_ACCESS_TOKEN
```

Get your access token from: https://qiita.com/settings/applications

**Required scope:** `write_qiita` (for creating/updating articles)

## Endpoints Used

### Create Item (Article)

```
POST /api/v2/items
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request body:**
```json
{
  "title": "Article Title",
  "body": "# Content\n\nMarkdown body here...",
  "tags": [
    {"name": "Python", "versions": []},
    {"name": "API", "versions": []}
  ],
  "private": false,
  "tweet": false,
  "slide": false,
  "organization_url_name": null
}
```

**Response (201 Created):**
```json
{
  "id": "abcdef1234567890abcd",
  "title": "Article Title",
  "body": "# Content\n\nMarkdown body here...",
  "rendered_body": "<h1>Content</h1>\n<p>Markdown body here...</p>",
  "url": "https://qiita.com/username/items/abcdef1234567890abcd",
  "private": false,
  "tags": [
    {"name": "Python", "versions": []},
    {"name": "API", "versions": []}
  ],
  "likes_count": 0,
  "stocks_count": 0,
  "comments_count": 0,
  "page_views_count": null,
  "slide": false,
  "created_at": "2026-04-01T12:00:00+09:00",
  "updated_at": "2026-04-01T12:00:00+09:00",
  "user": {
    "id": "username",
    "permanent_id": 12345,
    "name": "Display Name",
    "items_count": 42,
    "followers_count": 100
  }
}
```

**Notes:**
- `tags` is required — at least 1 tag, array of `{name, versions}` objects
- `versions` is for specifying version ranges (e.g., `["3.9"]`); pass `[]` if not applicable
- `private: true` creates a limited-sharing article (only accessible via direct URL)
- `private: false` publishes publicly
- `tweet: true` posts to Twitter/X if the user has integration enabled
- `slide: true` enables slide/presentation mode
- `organization_url_name` publishes under an organization (null for personal)
- Tags are free-form — you can use any tag name, new tags are auto-created

### Update Item

```
PATCH /api/v2/items/{item_id}
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request body:** Same fields as Create, only include fields to update.

**Response (200 OK):** Same as Create response.

### Get Item

```
GET /api/v2/items/{item_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):** Full item object.

### List My Items

```
GET /api/v2/authenticated_user/items?page=1&per_page=20
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query params:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)

**Response (200 OK):** Array of item objects.

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Bad request (malformed JSON, missing required fields) |
| 401 | Invalid or missing access token |
| 403 | Forbidden (insufficient scope or permissions) |
| 404 | Item not found |
| 429 | Rate limit exceeded |

**Error body:**
```json
{
  "type": "bad_request",
  "message": "title is missing"
}
```

## Rate Limits

- **Authenticated:** 1,000 requests per hour
- **Unauthenticated:** 60 requests per hour per IP
- Rate limit headers: `Rate-Limit`, `Rate-Remaining`, `Rate-Reset`

## Markdown Extensions

Qiita supports GitHub Flavored Markdown plus:

```markdown
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

# Diagrams (Mermaid)
```mermaid
graph TD
    A --> B
```

# Task lists
- [x] Done
- [ ] Todo
```
