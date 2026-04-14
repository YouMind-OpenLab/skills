# YouMind Dev.to OpenAPI Reference

Base URL: `https://youmind.com/openapi/v1`

These endpoints publish to Dev.to through YouMind. The caller only sends a YouMind API key in `x-api-key`. The user's Dev.to token is stored in YouMind and never placed in the skill config.

## Authentication

All requests require:

```text
x-api-key: sk-ym-xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

Get your YouMind API key from: <https://youmind.com/settings/api-keys>

## Preconditions

- The skill reads `youmind.api_key` and `youmind.base_url` from local `config.yaml`
- The user has already connected Dev.to inside YouMind

## Endpoints Used

### Create Article

```text
POST /devto/createArticle
```

**Request body:**

```json
{
  "title": "Article Title",
  "body_markdown": "# Content\n\nMarkdown body here...",
  "published": false,
  "tags": ["typescript", "webdev"],
  "description": "Short description for SEO (max 170 chars)",
  "canonical_url": "https://yourblog.com/original-post",
  "cover_image": "https://example.com/cover.jpg",
  "series": "My Series Name"
}
```

**Response:**

```json
{
  "id": 12345,
  "title": "Article Title",
  "description": "Short description...",
  "slug": "article-title-abc1",
  "url": "https://dev.to/username/article-title-abc1",
  "canonical_url": null,
  "cover_image": null,
  "published": false,
  "published_at": null,
  "tag_list": ["typescript", "webdev"],
  "tags": "typescript, webdev",
  "body_markdown": "...",
  "body_html": "...",
  "reading_time_minutes": 5,
  "user": {
    "username": "yourusername",
    "name": "Your Name"
  }
}
```

### Update Article

```text
POST /devto/updateArticle
```

**Request body:** same fields as create, plus `id`. Only send the fields you want to update.

### Get Article

```text
POST /devto/getArticle
```

**Request body:**

```json
{
  "id": 12345
}
```

### List My Articles

```text
POST /devto/listMyArticles
```

**Request body:**

```json
{
  "page": 1,
  "per_page": 30
}
```

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Dev.to account not connected in YouMind, or Dev.to rejected the request |
| 401 | Invalid or missing YouMind API key |
| 404 | Dev.to article not found |
| 422 | Validation error (bad tags, missing title, etc.) |

Typical connection error:

```json
{
  "message": "Dev.to account is not connected in YouMind. Save the Dev.to token in YouMind first."
}
```

## Notes

- `published: false` creates a draft
- `published: true` publishes immediately
- `tags` supports up to 4 items
- The skill should never ask the user to fill `devto.api_key` locally
