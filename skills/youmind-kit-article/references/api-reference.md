# YouMind Kit OpenAPI Reference

Base URL: `https://youmind.com/openapi/v1`

Auth header:

```text
x-api-key: sk-ym-xxxxxxxxxxxxxxxx
Content-Type: application/json
```

The skill only stores the YouMind API key locally. Kit credentials live in YouMind Connector Settings.

## Endpoints

- `POST /kit/validateConnection`
- `POST /kit/listEmailTemplates`
- `POST /kit/createBroadcast`
- `POST /kit/updateBroadcast`
- `POST /kit/getBroadcast`
- `POST /kit/deleteBroadcast`
- `POST /kit/listBroadcasts`

## Create Broadcast Example

```json
{
  "subject": "Weekly Shipping Notes",
  "content": "<p>Hello Kit</p>",
  "description": "Internal description",
  "previewText": "A quick summary",
  "isPublic": true,
  "sendAt": null,
  "thumbnailUrl": "https://example.com/cover.jpg"
}
```

## Notes

- `validateConnection` proxies `GET /v4/account` and `GET /v4/account/creator_profile`.
- `listEmailTemplates` proxies `GET /v4/email_templates` so you can discover valid `email_template_id` values.
- `content` must be HTML.
- `isPublic` controls whether the post appears on the public web feed.
- `sendAt` can schedule the email send.
- When omitted, YouMind defaults to a public web post with no scheduled send.
- Private broadcasts usually do not return a public URL; inspect them in `https://app.kit.com/campaigns`.
- Kit can reject create/update if the sender email address is not yet confirmed on the Kit side.
