# YouMind Beehiiv OpenAPI Reference

Base URL: `https://youmind.com/openapi/v1`

Auth header:

```text
x-api-key: sk-ym-xxxxxxxxxxxxxxxx
Content-Type: application/json
```

The skill only stores the YouMind API key locally. Beehiiv credentials live in YouMind Connector Settings.

## Endpoints

- `POST /beehiiv/validateConnection`
- `POST /beehiiv/createPost`
- `POST /beehiiv/updatePost`
- `POST /beehiiv/getPost`
- `POST /beehiiv/deletePost`
- `POST /beehiiv/listPosts`
- `POST /beehiiv/listPostTemplates`

## Create Post Example

```json
{
  "title": "Shipping Velocity Notes",
  "bodyContent": "<p>Hello Beehiiv</p>",
  "subtitle": "What changed this week",
  "postTemplateId": "post_template_00000000-0000-0000-0000-000000000000",
  "status": "draft",
  "customLinkTrackingEnabled": true,
  "emailCaptureTypeOverride": "popup",
  "socialShare": "top",
  "contentTags": ["ai", "product"],
  "thumbnailImageUrl": "https://example.com/cover.jpg",
  "recipients": {
    "web": { "tierIds": ["free"] },
    "email": { "tierIds": ["free", "premium"] }
  },
  "emailSettings": {
    "emailSubjectLine": "Shipping Velocity Notes",
    "emailPreviewText": "A quick product update"
  },
  "webSettings": {
    "hideFromFeed": false,
    "slug": "shipping-velocity-notes"
  },
  "seoSettings": {
    "defaultTitle": "Shipping Velocity Notes"
  }
}
```

## List Post Templates Example

```json
{
  "page": 1,
  "limit": 10,
  "order": "asc",
  "orderBy": "created"
}
```

## List Posts Filters

- `status`: `draft | confirmed | archived | all`
- `audience`: `free | premium | all`
- `platform`: `web | email | both | all`
- `contentTags`, `slugs`, `authors`, `premiumTiers`
- `orderBy`: `created | publish_date | displayed_date`
- `direction`: `asc | desc`
- `hiddenFromFeed`: `all | true | false`

## Notes

- `bodyContent` must be HTML unless you pass raw Beehiiv `blocks`.
- `status` is `draft` or `confirmed`. Beehiiv 官方文档提到上游默认值未来会从 `confirmed` 改成 `draft`，所以这里建议显式传值。
- `scheduledAt` can be used with `confirmed` to schedule.
- `listPostTemplates` should be the first stop when you need a specific Beehiiv layout.
- Beehiiv can reject creation with `403` if the publication does not have Send API access.
- Beehiiv 官方文档目前把 `updatePost` 标成 `beta / Enterprise`。
