# Hashnode API Reference

This skill no longer talks to Hashnode directly from the local machine. The local CLI calls YouMind OpenAPI, and YouMind uses the Hashnode credentials stored in the user's connector settings.

## Local Auth

Use a YouMind API key locally:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Connector setup lives in YouMind:

- Connect Hashnode: [https://youmind.com/settings/connector](https://youmind.com/settings/connector)
- Upgrade for article dispatch if needed: [https://youmind.com/pricing](https://youmind.com/pricing)

## YouMind Hashnode OpenAPI Endpoints

All requests use:

```http
POST /openapi/v1/hashnode/<operation>
x-api-key: sk-ym-...
Content-Type: application/json
```

Supported operations:

- `/hashnode/createDraft`
- `/hashnode/publishDraft`
- `/hashnode/getDraft`
- `/hashnode/listDrafts`
- `/hashnode/createPost`
- `/hashnode/updatePost`
- `/hashnode/getPost`
- `/hashnode/listPosts`
- `/hashnode/listPublished`
- `/hashnode/searchTags`
- `/hashnode/validateConnection`

## Draft Creation

Request body:

```json
{
  "title": "Shipping a GraphQL API with TypeScript",
  "contentMarkdown": "# Title\n\nMarkdown body",
  "subtitle": "Build, type, and ship cleanly",
  "tags": ["typescript", "graphql"],
  "coverImageUrl": "https://example.com/cover.png",
  "canonicalUrl": "https://example.com/original",
  "seriesId": "series-id",
  "metaTitle": "Shipping a GraphQL API with TypeScript",
  "metaDescription": "A practical guide to building and shipping a typed GraphQL API."
}
```

Response shape:

```json
{
  "id": "draft-id",
  "status": "draft",
  "title": "Shipping a GraphQL API with TypeScript",
  "slug": "shipping-a-graphql-api-with-typescript",
  "dashboardUrl": "https://hashnode.com/dashboards/<publication-id>"
}
```

## Immediate Publish

Use `/hashnode/createPost` with the same payload when the user explicitly wants a public post right away.

## Tag Lookup

Hashnode's official API exposes exact tag lookup rather than a full fuzzy tag search endpoint. The skill therefore treats `search-tags` as exact or slug-like lookup.

Example:

```json
{
  "query": "typescript",
  "limit": 5
}
```

## Validation

`/hashnode/validateConnection` checks:

- the user's YouMind plan is eligible for article dispatch
- a Hashnode account is connected in YouMind
- the saved Hashnode token can access the saved publication

Success example:

```json
{
  "ok": true,
  "message": "Connected to Hashnode publication \"My Blog\". Found 12 published post(s) and 3 draft(s).",
  "publicationUrl": "https://myblog.hashnode.dev",
  "dashboardUrl": "https://hashnode.com/dashboards/<publication-id>"
}
```

Failure example when Hashnode is not connected in YouMind:

```json
{
  "message": "Hashnode account is not connected in YouMind. Go to https://youmind.com/settings/connector and connect your Hashnode account first.",
  "detail": {
    "connectUrl": "https://youmind.com/settings/connector"
  }
}
```

Failure example when the plan is not eligible:

```json
{
  "code": "FEATURE_ACCESS_DENIED",
  "detail": {
    "upgradeUrl": "https://youmind.com/pricing"
  }
}
```

## Upstream Hashnode Notes

YouMind uses Hashnode's official GraphQL API behind the scenes. Relevant upstream capabilities include:

- `createDraft`
- `publishDraft`
- `publishPost`
- `updatePost`
- `draft(id: ...)`
- `post(id: ...)`
- `publication(id: ...) { posts ... drafts ... }`
