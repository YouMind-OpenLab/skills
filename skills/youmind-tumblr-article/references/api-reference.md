# YouMind Tumblr OpenAPI Reference

This skill talks to Tumblr through YouMind OpenAPI, not directly from the local machine.

## Base URL

```text
https://youmind.com/openapi/v1
```

Common headers:

- `Content-Type: application/json`
- `x-api-key: <youmind api key>`
- `x-use-camel-case: true`

## Supported endpoints

### `POST /createTumblrPost`

Publish a Tumblr **text post**.

Body:

```json
{
  "title": "Shipping our new release notes on Tumblr",
  "content": "<p>Hello Tumblr.</p><p>This is our update.</p>",
  "tags": ["product", "release-notes"],
  "coverImageUrl": "https://cdn.gooo.ai/example-cover.jpg",
  "blogIdentifier": "team-blog",
  "state": "draft",
  "publishOn": "2026-04-18T09:30:00Z",
  "date": "2026-04-01T08:00:00Z",
  "slug": "shipping-our-new-release-notes"
}
```

### `POST /createTumblrPhotoPost`

Publish a Tumblr **photo post** from a public image URL.

Body:

```json
{
  "sourceUrl": "https://cdn.gooo.ai/example-image.jpg",
  "caption": "<p>A short creator note under the image.</p>",
  "link": "https://youmind.com/blog/visual-refresh",
  "tags": ["visual-design", "product-update"],
  "state": "draft"
}
```

Use this when the image is the main object. If the image is only supporting material, prefer `createTumblrPost` with `coverImageUrl`.

### `POST /listTumblrPosts`

Read Tumblr collections:

- `published`
- `draft`
- `queue`
- `submission`

Body fields:

- `state?`
- `blogIdentifier?`
- `limit?`
- `offset?`
- `notesInfo?`

### `POST /listTumblrNotes`

Read notes for a specific post. This is the closest thing Tumblr exposes to “comments”.

Body fields:

- `postId` required
- `blogIdentifier?`
- `mode?`: `all`, `likes`, `conversation`, `rollup`, `reblogs_with_tags`
- `beforeTimestamp?`

Practical guidance:

- Use `conversation` when the user says “看评论” or “看回复”
- Use `reblogs_with_tags` when the user wants传播语境 and tag usage
- Use `all` when doing a full audit

Important:

- Tumblr notes are a **public-post** surface
- draft/private/dashboard-only share links may not be readable through this endpoint
- if notes are unavailable for a post, fall back to notifications + the blog URL

### `POST /listTumblrNotifications`

Read blog activity feed items such as:

- `reply`
- `reblog_with_content`
- `follow`
- `mention_in_post`
- `conversational_note`

Body fields:

- `blogIdentifier?`
- `before?`
- `types?`
- `rollups?`
- `omitPostIds?`

### `POST /listTumblrFollowers`

Read follower snapshots for the connected blog.

Body fields:

- `blogIdentifier?`
- `limit?`
- `offset?`

### `POST /getTumblrLimits`

Read Tumblr account limits such as:

- remaining posts per day
- remaining photo uploads per day
- remaining follows per day

### `POST /reorderTumblrQueue`

Move a queued post to a new position.

Body:

```json
{
  "postId": "814151210193043456",
  "insertAfter": "0"
}
```

`insertAfter: "0"` means move the post to the top.

### `POST /shuffleTumblrQueue`

Randomly shuffle the queue for the connected blog.

### `POST /deleteTumblrPost`

Delete a Tumblr post.

Body:

```json
{
  "postId": "814151210193043456"
}
```

## Result semantics

Text post response:

```json
{
  "postId": "123456789012345678",
  "blogIdentifier": "team-blog",
  "url": "https://www.tumblr.com/team-blog/123456789012345678/shipping-our-new-release-notes",
  "title": "Shipping our new release notes on Tumblr",
  "state": "draft"
}
```

Photo post response:

```json
{
  "postId": "123456789012345678",
  "blogIdentifier": "team-blog",
  "url": "https://www.tumblr.com/team-blog/123456789012345678/visual-refresh",
  "caption": "<p>A short creator note under the image.</p>",
  "state": "draft"
}
```

If Tumblr does not return an exact `post_url`, YouMind falls back to the blog-level Tumblr URL so the user still has a navigable result link.

## Hostname / blog identifier rule

Do not ask the user to manually supply Tumblr hostname unless they explicitly want an override.

- YouMind stores the connected blog identity at OAuth completion time
- Standard blogs can usually be addressed by short name
- Custom-domain blogs need hostname-aware handling

The skill should treat `blogIdentifier` as an optional override, not a required setup burden.

## CLI mapping

The local toolkit maps these endpoints to:

- `publish`
- `publish-photo`
- `list`
- `notes`
- `notifications`
- `followers`
- `limits`
- `queue-reorder`
- `queue-shuffle`
- `delete`

## Failure patterns

- Missing YouMind key: local config error before request
- Tumblr not connected: OpenAPI returns an auth/connect error
- Tumblr token revoked: request returns an auth error; reconnect Tumblr in YouMind
- Exact post URL unavailable: fall back to the blog URL
- Public notes endpoint unstable for a given post: fall back to notifications + blog link
