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

## Create Post Example

```json
{
  "title": "Shipping Velocity Notes",
  "bodyContent": "<p>Hello Beehiiv</p>",
  "subtitle": "What changed this week",
  "status": "draft",
  "contentTags": ["ai", "product"],
  "thumbnailImageUrl": "https://example.com/cover.jpg"
}
```

## Notes

- `bodyContent` must be HTML.
- `status` is `draft` or `confirmed`.
- `scheduledAt` can be used with `confirmed` to schedule.
- Beehiiv can reject creation with `403` if the publication does not have Send API access.
