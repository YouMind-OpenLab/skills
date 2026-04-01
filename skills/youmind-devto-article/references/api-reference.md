# Dev.to API Reference

Base URL: `https://dev.to/api`

Full API docs: https://developers.forem.com/api/v1

## Authentication

All requests require the `api-key` header:

```
api-key: YOUR_DEV_TO_API_KEY
```

Get your API key from: https://dev.to/settings/extensions

## Endpoints Used

### Create Article

```
POST /api/articles
Content-Type: application/json
api-key: YOUR_API_KEY
```

**Request body:**
```json
{
  "article": {
    "title": "Article Title",
    "body_markdown": "# Content\n\nMarkdown body here...",
    "published": false,
    "tags": ["typescript", "webdev"],
    "description": "Short description for SEO (max 170 chars)",
    "canonical_url": "https://yourblog.com/original-post",
    "cover_image": "https://example.com/cover.jpg",
    "series": "My Series Name"
  }
}
```

**Response (201 Created):**
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

**Notes:**
- `published: false` creates a draft (default)
- `published: true` publishes immediately
- `tags` array max 4 items, lowercase, alphanumeric + hyphens
- `description` max 170 characters
- `body_markdown` supports standard Markdown + Liquid tags

### Update Article

```
PUT /api/articles/{id}
Content-Type: application/json
api-key: YOUR_API_KEY
```

**Request body:** Same as Create, only include fields to update.

**Response (200 OK):** Same as Create response.

### Get Article

```
GET /api/articles/{id}
api-key: YOUR_API_KEY
```

**Response (200 OK):** Full article object including:
- `body_markdown`, `body_html`
- `comments_count`, `positive_reactions_count`, `public_reactions_count`
- `page_views_count` (only for own articles)
- `reading_time_minutes`

### List My Articles

```
GET /api/articles/me?page=1&per_page=30
api-key: YOUR_API_KEY
```

**Query params:**
- `page` (default: 1)
- `per_page` (default: 30, max: 1000)

**Response (200 OK):** Array of article objects (without `body_markdown`/`body_html`).

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Invalid or missing API key |
| 403 | Forbidden (rate limit or permissions) |
| 404 | Article not found |
| 422 | Validation error (bad tags, missing title, etc.) |
| 429 | Rate limit exceeded |

**Error body:**
```json
{
  "error": "not found",
  "status": 404
}
```

## Rate Limits

- **Authenticated:** 30 requests per 30 seconds
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Liquid Tags (Dev.to Extensions)

Dev.to supports special Liquid tags in markdown:

```markdown
{% embed https://github.com/user/repo %}
{% youtube dQw4w9WgXcQ %}
{% twitter 1234567890 %}
{% codepen https://codepen.io/user/pen/abc %}
{% codesandbox abc123 %}
{% replit @user/repl-name %}
{% details Summary text %}
Hidden details here
{% enddetails %}
```
