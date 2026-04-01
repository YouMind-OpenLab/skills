# Reddit API Reference

## Authentication

Reddit uses OAuth 2.0. For script-type apps, the password grant flow is simplest.

### Password Grant Flow (Script Apps)

```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded

grant_type=password&username={username}&password={password}
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "scope": "*"
}
```

Notes:
- Token expires in 3600 seconds (1 hour)
- Cache and refresh before expiry
- Base64 encode `client_id:client_secret` for Basic auth header

### Using the Token

All API requests go to `https://oauth.reddit.com/` with:
```
Authorization: Bearer {access_token}
User-Agent: youmind-reddit/1.0 by /u/username
```

**Important**: Always include a descriptive User-Agent header. Reddit blocks requests with generic user agents.

## Endpoints

### Submit Self Post
```
POST https://oauth.reddit.com/api/submit
Content-Type: application/x-www-form-urlencoded
```

Parameters:
- `api_type`: `json`
- `kind`: `self`
- `sr`: subreddit name (without r/)
- `title`: post title
- `text`: post body (Markdown)
- `resubmit`: `true` (allow resubmitting same URL)
- `flair_id`: (optional) flair UUID
- `flair_text`: (optional) flair text
- `sendreplies`: `true`/`false`
- `nsfw`: `true`/`false`
- `spoiler`: `true`/`false`

Response:
```json
{
  "json": {
    "errors": [],
    "data": {
      "id": "abc123",
      "name": "t3_abc123",
      "url": "/r/subreddit/comments/abc123/post_title/"
    }
  }
}
```

### Submit Link Post
Same as self post, but:
- `kind`: `link`
- `url`: the target URL (instead of `text`)

### Get Subreddit Rules
```
GET https://oauth.reddit.com/r/{subreddit}/about/rules
```

Response:
```json
{
  "rules": [
    {
      "kind": "comment",
      "description": "Rule description",
      "short_name": "Rule 1",
      "violation_reason": "Violation text"
    }
  ]
}
```

### Get Link Flairs
```
GET https://oauth.reddit.com/r/{subreddit}/api/link_flair_v2
```

Response: Array of flair objects:
```json
[
  {
    "id": "uuid-here",
    "text": "Discussion",
    "text_editable": false,
    "type": "text"
  }
]
```

### Get User Info
```
GET https://oauth.reddit.com/api/v1/me
```

Response:
```json
{
  "name": "username",
  "id": "user_id",
  "link_karma": 1234,
  "comment_karma": 5678,
  "created_utc": 1234567890
}
```

### Get Subreddit Info
```
GET https://oauth.reddit.com/r/{subreddit}/about
```

## Rate Limits

- 60 requests per minute per OAuth client
- Rate limit headers: `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`
- Posting: additional subreddit-specific rate limits (e.g., 10 min between posts for new accounts)

## Error Handling

Common errors in submit response:
- `["RATELIMIT", "you are doing that too much", 600]` -- wait N seconds
- `["SUBREDDIT_NOTALLOWED", "...", ""]` -- banned or private subreddit
- `["NO_SELFS", "...", ""]` -- subreddit doesn't allow self posts
- `["NO_LINKS", "...", ""]` -- subreddit doesn't allow link posts

## Creating a Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..."
3. Select **script** type
4. Set name and redirect URI (http://localhost:8080)
5. Note the client ID (under app name) and secret
