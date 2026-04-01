# WordPress REST API Reference

## Base URL

```
{site_url}/wp-json/wp/v2/
```

## Authentication

WordPress Application Passwords (WordPress 5.6+):
- Basic Auth: `Authorization: Basic base64(username:app_password)`
- Application Passwords are generated under Users > Profile > Application Passwords.

## Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List posts |
| GET | `/posts/{id}` | Get a single post |
| POST | `/posts` | Create a post |
| PUT | `/posts/{id}` | Update a post |
| DELETE | `/posts/{id}` | Delete a post |

#### Create Post Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Post title |
| `content` | string | Post content (HTML) |
| `excerpt` | string | Post excerpt |
| `status` | string | `publish`, `draft`, `pending`, `private`, `future` |
| `categories` | number[] | Category IDs |
| `tags` | number[] | Tag IDs |
| `featured_media` | number | Media attachment ID for featured image |
| `slug` | string | URL slug |
| `date` | string | ISO 8601 date for scheduling |
| `format` | string | Post format |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/media` | List media |
| GET | `/media/{id}` | Get media item |
| POST | `/media` | Upload media |

#### Upload Media
- Content-Type: `multipart/form-data`
- Field: `file` — the file binary

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List tags |
| POST | `/tags` | Create tag |

#### Create Tag Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Tag name |
| `slug` | string | Tag slug (optional, auto-generated) |

## Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `per_page` | number | Items per page (default: 10, max: 100) |
| `orderby` | string | Sort field: `date`, `id`, `title`, `slug` |
| `order` | string | Sort direction: `asc`, `desc` |
| `search` | string | Full-text search |
| `status` | string | Filter by status |

## Error Responses

```json
{
  "code": "rest_forbidden",
  "message": "Sorry, you are not allowed to do that.",
  "data": { "status": 403 }
}
```

Common error codes:
- `401` — Invalid credentials
- `403` — Insufficient permissions
- `404` — Resource not found
- `400` — Invalid parameters
