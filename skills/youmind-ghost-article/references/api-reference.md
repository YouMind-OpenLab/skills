# Ghost Admin API Reference

## Base URL

```
{site_url}/ghost/api/admin/
```

## Authentication

Ghost uses JWT (JSON Web Token) authentication for the Admin API.

### API Key Format
Admin API keys are provided as `{id}:{secret}`:
- `id`: 24-character hex string (used as JWT `kid` header)
- `secret`: 64-character hex string (used as HMAC-SHA256 signing key, hex-decoded)

### JWT Token Spec
```
Header:  { "alg": "HS256", "typ": "JWT", "kid": "{id}" }
Payload: { "iat": {now}, "exp": {now+300}, "aud": "/admin/" }
Signature: HMAC-SHA256(header.payload, hex_decode(secret))
```

### Authorization Header
```
Authorization: Ghost {jwt_token}
```

## Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/` | List posts |
| GET | `/posts/{id}/` | Get a single post |
| POST | `/posts/?source=html` | Create a post from HTML |
| PUT | `/posts/{id}/?source=html` | Update a post |
| DELETE | `/posts/{id}/` | Delete a post |

#### Create Post Body
```json
{
  "posts": [{
    "title": "Post Title",
    "html": "<p>Post content...</p>",
    "custom_excerpt": "Preview text for cards and newsletters",
    "status": "draft",
    "tags": [{"name": "Tag Name"}],
    "feature_image": "https://example.com/image.jpg",
    "visibility": "public"
  }]
}
```

#### Post Fields
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `html` | string | Post content (HTML) |
| `custom_excerpt` | string | Custom excerpt for previews |
| `status` | string | `draft`, `published`, `scheduled` |
| `tags` | array | `[{"name": "Tag"}]` or `[{"id": "abc123"}]` |
| `feature_image` | string | URL of feature image |
| `featured` | boolean | Pin post as featured |
| `visibility` | string | `public`, `members`, `paid`, `tiers` |
| `slug` | string | URL slug |
| `published_at` | string | ISO 8601 date (for scheduling) |

#### Update Post
Updates require `updated_at` field from the current post (optimistic locking):
```json
{
  "posts": [{
    "title": "Updated Title",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }]
}
```

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/images/upload/` | Upload an image |

#### Upload Image
- Content-Type: `multipart/form-data`
- Fields: `file` (image binary), `purpose` ("image")
- Response: `{ "images": [{ "url": "...", "ref": null }] }`

### Tags

Tags are managed implicitly through posts. When creating/updating a post, include tags by name and Ghost will create them if they don't exist.

## Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 15, max: varies) |
| `order` | string | Sort: `published_at desc`, `created_at asc` |
| `include` | string | Related data: `tags`, `authors`, `tags,authors` |
| `filter` | string | NQL filter: `status:published`, `tag:news` |
| `fields` | string | Specific fields: `title,slug,published_at` |

## Error Responses

```json
{
  "errors": [{
    "message": "Resource not found.",
    "type": "NotFoundError",
    "details": null
  }]
}
```

Common error codes:
- `401` — Invalid or expired JWT token
- `403` — Insufficient permissions
- `404` — Resource not found
- `422` — Validation error (e.g., duplicate slug)

## Rate Limiting

Ghost does not enforce strict rate limits on self-hosted instances. Ghost Pro has soft limits — typically 100 requests/minute for the Admin API.
