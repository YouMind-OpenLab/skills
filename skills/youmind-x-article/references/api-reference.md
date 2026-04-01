# X (Twitter) API Reference

## Authentication

X supports two authentication methods:

### OAuth 2.0 (Recommended)
- Bearer token for app-only access (read-only)
- User access token for user actions (posting, deleting)
- Scopes: `tweet.read`, `tweet.write`, `users.read`

### OAuth 1.0a (Legacy)
- Four credentials: API key, API secret, access token, access token secret
- HMAC-SHA1 signature for each request
- Required for media upload endpoint (v1.1)

## API v2 Endpoints

### Create Tweet
```
POST https://api.x.com/2/tweets
```

Headers:
```
Authorization: Bearer {user_access_token}
Content-Type: application/json
```

Body:
```json
{
  "text": "Tweet content here"
}
```

With reply:
```json
{
  "text": "Reply content",
  "reply": {
    "in_reply_to_tweet_id": "1234567890"
  }
}
```

With media:
```json
{
  "text": "Tweet with image",
  "media": {
    "media_ids": ["1234567890"]
  }
}
```

With quote:
```json
{
  "text": "My commentary",
  "quote_tweet_id": "1234567890"
}
```

### Delete Tweet
```
DELETE https://api.x.com/2/tweets/{id}
```

### Get User
```
GET https://api.x.com/2/users/me
```

## API v1.1 Endpoints (Media Upload)

Media upload still uses the v1.1 endpoint.

### Upload Media
```
POST https://upload.twitter.com/1.1/media/upload.json
Content-Type: application/x-www-form-urlencoded
```

Parameters (form-encoded):
- `media_data`: Base64-encoded media
- `media_category`: `tweet_image` or `tweet_video`

Response:
```json
{
  "media_id": 1234567890,
  "media_id_string": "1234567890",
  "size": 12345,
  "expires_after_secs": 86400
}
```

## OAuth 1.0a Signature Generation

For requests requiring OAuth 1.0a:

1. Collect OAuth parameters: `oauth_consumer_key`, `oauth_nonce`, `oauth_signature_method` (HMAC-SHA1), `oauth_timestamp`, `oauth_token`, `oauth_version` (1.0)
2. Combine with request parameters, sort alphabetically
3. Create parameter string: `key=value` joined by `&`
4. Create signature base string: `METHOD&url&params` (all percent-encoded)
5. Create signing key: `consumer_secret&token_secret`
6. Generate HMAC-SHA1 signature
7. Add `oauth_signature` to Authorization header

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /tweets | 200 tweets | 15 min |
| DELETE /tweets | 50 requests | 15 min |
| GET /users/me | 75 requests | 15 min |
| Media upload | 615 requests | 15 min |

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Invalid or expired credentials |
| 403 | Account suspended or app not authorized |
| 429 | Rate limit exceeded |
| 400 | Bad request (invalid tweet text, duplicate, etc.) |
