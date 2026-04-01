# Medium API Reference

> **Deprecation Notice:** Medium's Publishing API is officially deprecated and unmaintained. It still functions but receives no updates or bug fixes. There are only 4 endpoints available.

Base URL: `https://api.medium.com/v1`

Official docs (archived): https://github.com/Medium/medium-api-docs

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_INTEGRATION_TOKEN
Content-Type: application/json
Accept: application/json
```

Get your integration token from: https://medium.com/me/settings/security

## Endpoints

### 1. Get Authenticated User

```
GET /v1/me
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "5303d74c64f66366f00cb9b2a94f3251bf5",
    "username": "majelbstoat",
    "name": "Jamie Talbot",
    "url": "https://medium.com/@majelbstoat",
    "imageUrl": "https://images.medium.com/0*fkfQiTzT7TlUGGyI.png"
  }
}
```

### 2. Get User's Publications

```
GET /v1/users/{userId}/publications
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "b969ac62a46b",
      "name": "About Medium",
      "description": "What is this thing and how does it work?",
      "url": "https://medium.com/about",
      "imageUrl": "https://cdn-images-1.medium.com/fit/c/200/200/0*ae1jbP.png"
    }
  ]
}
```

### 3. Create Post (User Profile)

```
POST /v1/users/{authorId}/posts
Authorization: Bearer {token}
Content-Type: application/json
```

**Request body:**
```json
{
  "title": "Liverpool FC",
  "contentFormat": "html",
  "content": "<h1>Liverpool FC</h1><p>You'll Never Walk Alone.</p>",
  "canonicalUrl": "https://yoursite.com/original-post",
  "tags": ["football", "sport", "liverpool"],
  "publishStatus": "public"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Title of the post |
| `contentFormat` | string | Yes | `"html"` or `"markdown"` |
| `content` | string | Yes | Body content in the specified format |
| `tags` | string[] | No | Up to 5 tags for the post |
| `canonicalUrl` | string | No | Original URL if cross-posting |
| `publishStatus` | string | No | `"public"`, `"draft"`, or `"unlisted"` (default: `"public"`) |

**Response (201 Created):**
```json
{
  "data": {
    "id": "e6f36a",
    "title": "Liverpool FC",
    "authorId": "5303d74c64f66366f00cb9b2a94f3251bf5",
    "tags": ["football", "sport", "liverpool"],
    "url": "https://medium.com/@majelbstoat/liverpool-fc-e6f36a",
    "canonicalUrl": "https://yoursite.com/original-post",
    "publishStatus": "public",
    "publishedAt": 1442286338435,
    "license": "",
    "licenseUrl": "https://medium.com/policy/9db0094a1e0f"
  }
}
```

### 4. Create Post (Publication)

```
POST /v1/publications/{publicationId}/posts
Authorization: Bearer {token}
Content-Type: application/json
```

**Request body:** Same as Create Post (User Profile).

**Response (201 Created):** Same as Create Post response, with additional `publicationId` field.

**Note:** The authenticated user must be a writer for the publication.

## What the API Does NOT Support

The following operations are **not available** through the API:

- **Update/edit** an existing post
- **Delete** a post
- **List** a user's posts
- **Get** a specific post by ID
- **Analytics** or engagement data
- **Comments** management
- **Followers** management
- **Image upload** (embed image URLs in content instead)

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Invalid or missing token |
| 403 | Forbidden (not authorized for this action) |
| 400 | Bad request (invalid parameters) |

**Error body:**
```json
{
  "errors": [
    {
      "message": "Token was invalid.",
      "code": 6003
    }
  ]
}
```

## Rate Limits

Rate limits are not officially documented. In practice:
- The API is lenient for normal publishing workflows
- Avoid bulk publishing (more than a few posts per hour)
- There is no rate limit header in responses

## Content Format Notes

### Markdown (`contentFormat: "markdown"`)
- Standard Markdown syntax
- Headings, bold, italic, links, images, code blocks, blockquotes
- Medium renders it into their native format
- Simpler to work with programmatically

### HTML (`contentFormat: "html"`)
- Standard HTML tags
- Medium strips unsupported tags
- Supported: `<h1>`-`<h4>`, `<p>`, `<a>`, `<strong>`, `<em>`, `<blockquote>`, `<pre>`, `<code>`, `<ul>`, `<ol>`, `<li>`, `<img>`, `<figure>`, `<figcaption>`
- Use for more precise formatting control
