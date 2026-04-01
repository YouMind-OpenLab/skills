# Instagram Graph API Reference

## Overview

Instagram content publishing uses the **Facebook Graph API** (not a separate Instagram API).
All requests go through the Facebook Graph API base URL.

**Base URL**: `https://graph.facebook.com/v19.0/`

**Authentication**: Access token passed as `access_token` query parameter.

**Required Permissions**:
- `instagram_basic` — read account info and media
- `instagram_content_publish` — create and publish posts
- `pages_show_list` — list pages (needed during setup)

## Two-Step Publishing Flow

Instagram uses a mandatory two-step publish flow:

```
Step 1: Create Container  ->  POST /{ig_user_id}/media
Step 2: Poll Status       ->  GET /{container_id}?fields=status_code
Step 3: Publish           ->  POST /{ig_user_id}/media_publish
```

For carousels, steps 1-2 repeat for each child image before creating the carousel container.

## Endpoints

### POST /{ig_user_id}/media — Create Media Container

**Single Image**:
| Parameter | Type | Description |
|-----------|------|-------------|
| image_url | string | Publicly accessible image URL (REQUIRED) |
| caption | string | Post caption (max 2,200 chars) |

**Carousel Child**:
| Parameter | Type | Description |
|-----------|------|-------------|
| image_url | string | Publicly accessible image URL |
| is_carousel_item | boolean | Must be `true` |

**Carousel Container**:
| Parameter | Type | Description |
|-----------|------|-------------|
| media_type | string | Must be `CAROUSEL` |
| children | string | Comma-separated child container IDs |
| caption | string | Post caption |

**Response**:
```json
{ "id": "container_id" }
```

### GET /{container_id} — Check Container Status

**Fields**: `id`, `status_code`

**Status Codes**:
| Code | Meaning |
|------|---------|
| IN_PROGRESS | Still processing |
| FINISHED | Ready to publish |
| ERROR | Processing failed |
| EXPIRED | Container expired (24h limit) |

### POST /{ig_user_id}/media_publish — Publish Media

| Parameter | Type | Description |
|-----------|------|-------------|
| creation_id | string | Container ID to publish |

**Response**:
```json
{ "id": "media_id" }
```

### GET /{ig_user_id}/media — List Account Media

**Parameters**: `fields`, `limit`

**Fields**: `id`, `caption`, `media_type`, `media_url`, `permalink`, `timestamp`

### GET /{ig_user_id} — Account Info

**Fields**: `id`, `username`, `media_count`

### GET /{media_id} — Get Specific Media

**Fields**: `id`, `caption`, `media_type`, `media_url`, `permalink`, `timestamp`

## Important Constraints

### Image Requirements
- Must be hosted on a **publicly accessible URL**
- Instagram downloads the image during container creation
- Supported formats: JPEG, PNG
- Max file size: 8MB
- Recommended dimensions: 1080x1080 (square) or 1080x1350 (portrait)

### Carousel Constraints
- Minimum: 2 images
- Maximum: 10 images
- All images must be the same aspect ratio
- Each child container must finish processing before creating the carousel container

### Container Expiration
- Containers expire after **24 hours** if not published
- Always poll status before publishing
- If expired, create a new container

### Rate Limits
- 50 media containers per day per Instagram account
- 25 API calls per hour per token for content publishing
- Rate limit errors return HTTP 429

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| OAuthException | Invalid/expired token | Refresh token |
| Image download failed | URL not publicly accessible | Use a public CDN URL |
| Carousel too few items | Less than 2 children | Add more images |
| Container expired | Published after 24h | Create new container |
| Rate limit exceeded | Too many API calls | Wait and retry |

## Token Management

The access token is a **Facebook Page Access Token** that has been granted
Instagram permissions. It is NOT a separate Instagram token.

### Getting the Token
1. Create a Facebook App at developers.facebook.com
2. Add Instagram Graph API product
3. Generate a User Token with `instagram_basic` + `instagram_content_publish`
4. Exchange for a long-lived token (60 days)
5. Use the long-lived token to get a Page Token
6. The Page Token inherits Instagram permissions

### Finding the Instagram Business Account ID
```
GET /me/accounts -> get page_id
GET /{page_id}?fields=instagram_business_account -> get ig_user_id
```
