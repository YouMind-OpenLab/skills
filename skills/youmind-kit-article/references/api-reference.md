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
- **Create vs update semantics**
  - `createBroadcast`: when `isPublic` / `sendAt` are omitted, YouMind fills sensible defaults for a brand-new broadcast — `isPublic=true`, `sendAt=null` (save as draft), and `publishedAt=now` if the broadcast is public.
  - `updateBroadcast`: behaves as a true partial update from the caller's perspective. Fields you do not pass are **left untouched**. Implementation note: Kit's native `PUT /v4/broadcasts/{id}` silently resets some omitted optional fields (observed on `send_at`), so YouMind first `GET`s the current broadcast, merges caller-supplied fields on top, and then forwards a complete payload to Kit. If you want to flip visibility or cancel a scheduled send during an update, send the field explicitly (`isPublic: false`, `sendAt: null`).
- Private broadcasts usually do not return a public URL; inspect them in `https://app.kit.com/campaigns`.
- Kit can reject create/update if the sender email address is not yet confirmed on the Kit side.
