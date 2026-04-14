# YouMind Ghost OpenAPI Reference

Base URL: `https://youmind.com/openapi/v1`

These endpoints publish to Ghost through YouMind. The caller only sends a YouMind API key in `x-api-key`. The user's Ghost site URL and Ghost Admin API key are stored inside YouMind and never placed in the skill config.

## Authentication

All requests require:

```text
x-api-key: sk-ym-xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

Get your YouMind API key from: <https://youmind.com/settings/api-keys>

## Preconditions

- The skill reads `youmind.api_key` and `youmind.base_url` from local `config.yaml`
- The user has already connected Ghost inside YouMind
- The current YouMind plan allows article dispatch OpenAPI (`Pro` / `Max`)

## Endpoints Used

### Validate Ghost Connection

```text
POST /ghost/validateConnection
```

Response:

```json
{
  "ok": true,
  "message": "Connected to Ghost site \"dongdong\". Found 3 total post(s).",
  "siteTitle": "dongdong",
  "siteUrl": "https://dongdong.ghost.io",
  "total": 3
}
```

### Create Post

```text
POST /ghost/createPost
```

Request body:

```json
{
  "title": "Ghost Article Title",
  "html": "<p>Hello Ghost</p>",
  "customExcerpt": "Short summary for cards and newsletters",
  "status": "draft",
  "tags": ["ai", "coding"],
  "featureImage": "https://example.com/cover.jpg",
  "featured": false,
  "visibility": "public",
  "slug": "ghost-article-title"
}
```

### Update Post

```text
POST /ghost/updatePost
```

Request body: same fields as create, plus `id`. Only send the fields you want to update.

### Get Post

```text
POST /ghost/getPost
```

Request body:

```json
{
  "id": "69de04770c17b300017b5650"
}
```

### List Posts

```text
POST /ghost/listPosts
POST /ghost/listDrafts
POST /ghost/listPublished
```

Request body:

```json
{
  "page": 1,
  "limit": 15
}
```

`/ghost/listPosts` also accepts optional `status` with one of:

- `draft`
- `published`
- `scheduled`
- `sent`

### Publish / Unpublish

```text
POST /ghost/publishPost
POST /ghost/unpublishPost
```

Request body:

```json
{
  "id": "69de04770c17b300017b5650"
}
```

### Upload Image

```text
POST /ghost/uploadImage
```

Request body:

```json
{
  "filename": "cover.jpg",
  "contentBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "contentType": "image/jpeg",
  "ref": "feature-image"
}
```

## Response Shape

Ghost post responses are normalized by YouMind and include both the public URL and the Ghost Admin editor URL:

```json
{
  "id": "69de04770c17b300017b5650",
  "title": "Ghost CLI Smoke Test",
  "slug": "ghost-cli-smoke-test",
  "status": "draft",
  "url": "https://dongdong.ghost.io/p/a841453d-c8fc-41d5-a635-e25a61d9a7d5/",
  "adminUrl": "https://dongdong.ghost.io/ghost/#/editor/post/69de04770c17b300017b5650",
  "excerpt": "This is a temporary draft created to verify the YouMind Ghost skill...",
  "published_at": null,
  "tags": []
}
```

Notes:

- `status: draft` is the default
- Drafts return a Ghost Admin URL so the user can review the post immediately
- `publishPost` changes the public URL from Ghost's draft permalink to the final published path

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Ghost account not connected in YouMind, or Ghost rejected the request |
| 401 | Invalid or missing YouMind API key |
| 402 | Current YouMind plan is not eligible for article dispatch OpenAPI |
| 404 | Ghost post not found |

Typical not-connected error:

```json
{
  "message": "Ghost account is not connected in YouMind. Go to https://youmind.com/settings/connector and connect your Ghost account first.",
  "code": "GHOST_ACCOUNT_NOT_CONNECTED",
  "detail": {
    "connectUrl": "https://youmind.com/settings/connector"
  }
}
```

Typical paid-plan error:

```json
{
  "message": "Publishing articles through YouMind OpenAPI requires a paid plan (pro or max). Upgrade at https://youmind.com/pricing.",
  "code": "FEATURE_ACCESS_DENIED",
  "detail": {
    "upgradeUrl": "https://youmind.com/pricing"
  }
}
```
