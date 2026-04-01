# LinkedIn API Reference

## Authentication

LinkedIn uses OAuth 2.0 for authentication.

### Required Scopes
- `w_member_social` -- Create, modify and delete posts
- `r_liteprofile` -- Read basic profile information
- `r_emailaddress` -- Read email address (optional)

### Access Token
- Bearer token passed in `Authorization` header
- Tokens expire (typically 60 days for 3-legged OAuth)
- Refresh tokens available for long-lived access

## Endpoints

### Create Post
```
POST https://api.linkedin.com/rest/posts
```

Headers:
```
Authorization: Bearer {access_token}
Content-Type: application/json
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
```

Body:
```json
{
  "author": "urn:li:person:{id}",
  "commentary": "Post text here...",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED"
}
```

### Upload Image

**Step 1: Register Upload**
```
POST https://api.linkedin.com/v2/assets?action=registerUpload
```

Body:
```json
{
  "registerUploadRequest": {
    "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
    "owner": "urn:li:person:{id}",
    "serviceRelationships": [
      {
        "relationshipType": "OWNER",
        "identifier": "urn:li:userGeneratedContent"
      }
    ]
  }
}
```

Response includes `uploadUrl` and `asset` URN.

**Step 2: Upload Binary**
```
PUT {uploadUrl}
Authorization: Bearer {access_token}
Content-Type: application/octet-stream

[binary image data]
```

### Get Profile
```
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer {access_token}
```

Returns:
```json
{
  "sub": "{person_id}",
  "name": "Full Name",
  "email": "user@example.com",
  "picture": "https://..."
}
```

## Organization Posts

To post as a company page, set `author` to `urn:li:organization:{id}` instead of `urn:li:person:{id}`. Requires the `w_organization_social` scope and admin access to the organization page.

## Rate Limits

- 100 API calls per day per member per application
- Post creation: subject to LinkedIn's spam detection
- Image upload: reasonable use (no published hard limit)

## Error Codes

| Code | Meaning |
|------|---------|
| 401  | Invalid or expired access token |
| 403  | Missing required OAuth scope |
| 422  | Invalid request body or URN |
| 429  | Rate limit exceeded |
