# YouMind X OpenAPI Reference

Base URL: `https://youmind.com/openapi/v1`

All X publishing flows through YouMind's OpenAPI proxy. The caller only sends a YouMind API key in `x-api-key`. The user's X access token and refresh token are stored inside YouMind (connected once via OAuth 2.0 PKCE in the YouMind product) and never placed in the skill config.

## Authentication

All requests require:

```text
x-api-key: sk-ym-xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
x-use-camel-case: true
```

Get your YouMind API key from: <https://youmind.com/settings/api-keys>

## Preconditions

- The skill reads `youmind.api_key` and `youmind.base_url` from local `config.yaml`
- The user has already connected their X account inside YouMind (one-click OAuth)
- No paid plan is required for `createXPost` — unlike `createTokenPlatformPost`, X publishing is free to call

## Endpoints Used

### Create Tweet

```text
POST /openapi/v1/createXPost
```

Request body:

```json
{
  "text": "Hello from YouMind!",
  "mediaUrls": [
    "https://cdn.gooo.ai/user-files/example-image.jpg"
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `text` | string, required | 1-280 characters. URLs still count as 23 characters on X's side. |
| `mediaUrls` | string[], optional | Up to 4 images. **Each URL must be under `cdn.gooo.ai`** — YouMind enforces this allowlist server-side to avoid SSRF. Non-CDN URLs will be rejected with `X_MEDIA_HOST_NOT_ALLOWED`. |
| `replyToPostId` | string, optional | Numeric tweet ID (`^\d{1,32}$`). When set, this tweet is published as a reply — X renders the chain natively. Pass the previous tweet's `postId` to build a proper thread. |

Response:

```json
{
  "postId": "1234567890123456789",
  "text": "Hello from YouMind!",
  "url": "https://x.com/your-handle/status/1234567890123456789"
}
```

## What is NOT in the OpenAPI Today

YouMind's X OpenAPI surface is deliberately narrow. The following are **not** available through the proxy today, and the skill handles them as follows:

| Missing feature | Skill behavior |
|-----------------|----------------|
| Quote tweet (`quote_tweet_id`) | Not supported. |
| Delete tweet | Not supported. |
| Fetch authenticated user (`/users/me`) | Not supported — `youmind-x validate` only checks the local API key. |
| Local media upload (base64 / multipart) | Not supported. Images must already be hosted under `cdn.gooo.ai`. |
| Long-form article (X Premium, 25K chars) | Not supported yet. |

Threads are fully supported now via `replyToPostId` — the skill publishes the first tweet, then chains each subsequent tweet to the previous one, producing an X-native thread.

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | X account not connected in YouMind, or X rejected the request (e.g., duplicate tweet, media URL not under cdn.gooo.ai) |
| 401 | Invalid or missing YouMind API key |
| 403 | X forbids this action (account suspended, app quota exceeded) |
| 429 | X rate limit exceeded — includes `retryAfterSeconds` detail |
| 502 | X API unavailable or media upload failed |

Typical not-connected error:

```json
{
  "message": "X account is not connected in YouMind. Go to https://youmind.com/settings/connector and connect your X account first.",
  "code": "X_ACCOUNT_NOT_CONNECTED",
  "detail": {
    "connectUrl": "https://youmind.com/settings/connector"
  }
}
```

Media host rejection:

```json
{
  "message": "Media URL host is not allowed.",
  "code": "X_MEDIA_HOST_NOT_ALLOWED",
  "detail": {
    "hint": "Only URLs under cdn.gooo.ai are accepted."
  }
}
```

Rate-limited response:

```json
{
  "code": "X_RATE_LIMITED",
  "retryAfterSeconds": 60
}
```
