# YouMind WordPress OpenAPI Reference

This skill talks to WordPress exclusively through YouMind's OpenAPI proxy.
The end user only ever supplies a YouMind API key; the WordPress site URL,
username, and Application Password are held server-side after the user
links WordPress in YouMind.

Base URL: `https://youmind.com/openapi/v1` (override via `youmind.base_url`
in `~/.youmind/config.yaml` or `~/.youmind/config/youmind-wordpress-article.yaml` for local dev, e.g. `http://localhost:4000/openapi/v1`).

## Authentication

Every request carries the YouMind API key in the `x-api-key` header:

```
x-api-key: sk-ym-...
Content-Type: application/json
```

If the user has not yet linked WordPress in YouMind, every endpoint returns
`400 WORDPRESS_ACCOUNT_NOT_CONNECTED` with `detail.connectUrl` pointing at
the YouMind connector settings page. Surface that URL to the user.

## Pre-conditions

1. A paid YouMind plan (Pro / Max) — proxy returns `402` otherwise.
2. WordPress linked in YouMind (Connector → WordPress → site URL +
   username + Application Password).

## Endpoints

All endpoints are `POST` with a JSON body. Empty body uses `{}`.

### `POST /wordpress/validateConnection`

Smoke-test the linked WordPress site.

**Request body:** `{}`

**Response:**
```json
{
  "ok": true,
  "message": "Connected to WordPress site as admin",
  "accountId": 1,
  "accountName": "Admin User",
  "accountUsername": "admin",
  "siteUrl": "https://example.com"
}
```

### `POST /wordpress/createPost`

**Request body:**
```json
{
  "title": "My Awesome Post",
  "content": "<p>Hello world</p>",
  "excerpt": "Optional plain or HTML excerpt",
  "status": "draft",
  "tags": ["AI", "YouMind"],
  "categories": ["Technology"],
  "featuredMedia": 456,
  "slug": "my-awesome-post",
  "date": "2026-04-30T09:00:00",
  "format": "standard"
}
```

- `status`: `publish | draft | pending | private | future` (default `draft`)
- `tags`: **names** — the proxy looks them up via `/tags?search=...` and
  auto-creates missing tags
- `categories`: **names** — the proxy looks them up but **does not**
  auto-create. Missing categories return `WORDPRESS_CATEGORY_NOT_FOUND`.
- `featuredMedia`: numeric ID returned by `uploadMedia`
- `date`: required when `status=future`

**Response (`WordPressPostDto`):**
```json
{
  "id": 123,
  "title": "My Awesome Post",
  "content": "<p>Hello world</p>",
  "excerpt": "Optional plain or HTML excerpt",
  "status": "draft",
  "slug": "my-awesome-post",
  "link": "https://example.com/?p=123",
  "author": 1,
  "featuredMedia": 456,
  "categories": [3],
  "tags": [7, 8],
  "date": "2026-04-15T01:02:03",
  "modified": "2026-04-15T01:02:03",
  "format": "standard",
  "adminUrl": "https://example.com/wp-admin/post.php?post=123&action=edit"
}
```

### `POST /wordpress/updatePost`

**Request body:**
```json
{ "id": 123, "title": "Updated", "status": "publish" }
```

Pass only the fields to change. `tags` / `categories` are name-resolved
the same way as `createPost`.

**Response:** `WordPressPostDto`

### `POST /wordpress/getPost`

**Request body:** `{ "id": 123, "context": "edit" }` (use `context: "edit"`
for full draft body and metadata).

**Response:** `WordPressPostDto`

### `POST /wordpress/deletePost`

**Request body:** `{ "id": 123, "force": false }`

- `force=false` (default) → moves to WP trash, recoverable
- `force=true` → permanent deletion

**Response:** `{ "ok": true, "id": 123, "deletedPermanently": false }`

### `POST /wordpress/publishPost` / `POST /wordpress/unpublishPost`

**Request body:** `{ "id": 123 }`

Convenience wrappers — `publishPost` is `updatePost(status="publish")`,
`unpublishPost` is `updatePost(status="draft")`.

**Response:** `WordPressPostDto`

### `POST /wordpress/listPosts`

**Request body:** `{ "page": 1, "perPage": 15, "status": "draft" }`
(`status` optional; `publish | draft | pending | private | future | any`)

**Response:**
```json
{
  "posts": [/* WordPressPostDto[] */],
  "total": 42,
  "totalPages": 3,
  "page": 1,
  "perPage": 15
}
```

### `POST /wordpress/listDrafts` / `POST /wordpress/listPublished`

Same response shape as `listPosts`, with status pre-filtered.

### `POST /wordpress/uploadMedia`

Upload an image (or other media) to the WordPress media library. The file
is hosted on the user's WP site itself — no hotlink concerns when
embedding the returned `sourceUrl` in post bodies.

**Request body:**
```json
{
  "filename": "screenshot.png",
  "contentBase64": "iVBORw0KGgo...",
  "contentType": "image/png",
  "altText": "Screenshot of the dashboard",
  "caption": "Figure 1"
}
```

- `contentType` is optional; derived from `filename` extension when omitted
- Max ~50 MB at the proxy boundary

**Response (`WordPressMediaDto`):**
```json
{
  "id": 456,
  "sourceUrl": "https://example.com/wp-content/uploads/2026/04/screenshot.png",
  "title": "screenshot",
  "mimeType": "image/png",
  "mediaType": "image",
  "slug": "screenshot",
  "altText": "Screenshot of the dashboard",
  "caption": "Figure 1",
  "markdown": "![Screenshot of the dashboard](https://example.com/wp-content/uploads/2026/04/screenshot.png)"
}
```

### `POST /wordpress/listCategories`

**Request body:** `{ "page": 1, "perPage": 50, "search": "tech" }`

**Response:**
```json
{
  "categories": [
    { "id": 3, "name": "Technology", "slug": "technology", "parent": 0, "count": 5, "description": "" }
  ],
  "total": 12,
  "totalPages": 1
}
```

### `POST /wordpress/listTags`

Same shape as `listCategories`, returns `tags` array.

## Error model

```json
{
  "message": "human-readable description",
  "code": "WORDPRESS_AUTH_INVALID",
  "detail": {
    "platform": "wordpress",
    "connectUrl": "https://youmind.com/settings/connector",
    "upgradeUrl": "https://youmind.com/billing",
    "upstreamMessage": "...",
    "categoryName": "Tech",
    "retryAfter": "60",
    "status": 401
  }
}
```

| HTTP | `code` | Meaning |
| --- | --- | --- |
| 400 | `WORDPRESS_ACCOUNT_NOT_CONNECTED` | Surface `detail.connectUrl` to user |
| 400 | `WORDPRESS_AUTH_INVALID` | Stored Application Password rejected — user reconnects |
| 400 | `WORDPRESS_CATEGORY_NOT_FOUND` | `detail.categoryName` is missing on the WP site; ask user to create it first |
| 400 | `WORDPRESS_RATE_LIMITED` | Back off using `detail.retryAfter` |
| 400 | `WORDPRESS_UPSTREAM_ERROR` | Generic WP failure; see `detail.upstreamMessage` |
| 402 | (no code) | Paid YouMind plan required |
| 403 | `WORDPRESS_FORBIDDEN` | Caller lacks permission for that resource |
| 404 | `WORDPRESS_NOT_FOUND` | Post / media ID doesn't exist |

## Notes for content authors

- WP post `content` is HTML, not Markdown. Convert Markdown locally
  (skill's `content-adapter.ts` does this with `markdown-it`) before
  passing to `createPost`.
- Featured images go through `uploadMedia` first; pass the returned `id`
  in `featuredMedia`. Inline images: embed the `sourceUrl` directly with
  standard markdown `![alt](url)` and let the HTML rendering take care of
  the rest.
- Tags auto-create. Categories don't — design your category tree in WP
  Admin first, then reference by name.
