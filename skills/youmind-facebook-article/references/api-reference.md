# Facebook Graph API Reference

## Overview

This skill uses the Facebook Graph API v19.0 to publish and manage Page posts.

**Base URL**: `https://graph.facebook.com/v19.0/`

**Authentication**: Page Access Token passed as `access_token` query parameter.

## Endpoints Used

### POST /{page_id}/feed
Create a text or link post on a Page.

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| message | string | Post text content |
| link | string | URL to share (creates preview card) |
| published | boolean | false = draft/unpublished |
| scheduled_publish_time | int | Unix timestamp for scheduled post |

**Response**:
```json
{ "id": "page_id_post_id" }
```

### POST /{page_id}/photos
Create a photo post or upload a staged photo.

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| url | string | Hosted image URL |
| source | file | Image file upload |
| caption | string | Photo caption |
| published | boolean | false = staged (not posted) |

**Response**:
```json
{ "id": "photo_id", "post_id": "page_id_post_id" }
```

### GET /{page_id}
Get Page information.

**Fields**: `name`, `id`, `fan_count`

### GET /{post_id}
Get a specific post.

**Fields**: `message`, `created_time`, `permalink_url`, `full_picture`, `type`

### GET /{page_id}/feed
List recent Page posts.

**Parameters**: `limit`, `fields`

## Required Permissions

- `pages_manage_posts` — create and manage Page posts
- `pages_read_engagement` — read post engagement metrics
- `pages_read_user_content` — read user comments on Page posts

## Token Types

### Page Access Token (Required)
- Obtained via Graph API Explorer or OAuth flow
- Must be a **long-lived** token for production use
- Short-lived tokens expire in ~1 hour
- Long-lived tokens last ~60 days
- Use a System User token for indefinite access

### Generating a Long-Lived Token

1. Get a short-lived User Access Token from Graph API Explorer
2. Exchange for long-lived User Token:
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token
     &client_id={app-id}
     &client_secret={app-secret}
     &fb_exchange_token={short-lived-token}
   ```
3. Get Page Token from long-lived User Token:
   ```
   GET /{user-id}/accounts?access_token={long-lived-user-token}
   ```

## Error Codes

| Code | Meaning |
|------|---------|
| 190 | Invalid or expired access token |
| 200 | Insufficient permissions |
| 368 | Content blocked by spam filter |
| 506 | Duplicate post detected |

## Rate Limits

- 200 calls per user per hour (per app)
- Posting rate: no hard limit, but rapid posting may trigger spam detection
- Recommended: no more than 1-2 posts per hour
