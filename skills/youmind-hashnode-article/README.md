# YouMind Hashnode Skill

AI-powered Hashnode article writing and publishing through YouMind OpenAPI.

The local skill only needs a YouMind API key. Your Hashnode token and publication are connected once inside YouMind, and the backend uses those saved credentials when publishing.

## Requirements

- Node.js >= 18
- A paid YouMind plan for article dispatch OpenAPI
- A Hashnode account connected in YouMind: [https://youmind.com/settings/connector](https://youmind.com/settings/connector)
- A YouMind API key: [https://youmind.com/settings/api-keys](https://youmind.com/settings/api-keys)

## Local Setup

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
```

Fill only the YouMind section:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Commands read `youmind.api_key` and `youmind.base_url` from local `config.yaml`.
Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change only your local `config.yaml`.

## Important Behavior

- Drafts are supported. `publish` creates a draft by default.
- Immediate publishing is supported with `--publish`.
- If your Hashnode account is not connected in YouMind, commands fail with a clear connector hint.
- If your YouMind plan is not eligible, the backend returns an upgrade hint pointing to [https://youmind.com/pricing](https://youmind.com/pricing).
- Local preview output is written to `output/`, which is git-ignored.

## Common Commands

```bash
cd toolkit

# Validate YouMind -> Hashnode connectivity
node dist/cli.js validate

# Create a draft on Hashnode
node dist/cli.js publish ../output/article.md --draft

# Publish immediately
node dist/cli.js publish ../output/article.md --publish

# List drafts
node dist/cli.js list-drafts --page 1 --limit 10

# List published posts
node dist/cli.js list-published --page 1 --limit 10

# Publish an existing draft by id
node dist/cli.js publish-draft <draft_id>

# Fetch a draft or post
node dist/cli.js get-draft <draft_id>
node dist/cli.js get-post <post_id>

# Validate tags / adapted markdown locally
node dist/cli.js preview ../output/article.md
node dist/cli.js search-tags typescript
```

## Error Flows

If Hashnode is not connected in YouMind, the CLI surfaces a message like:

```text
Hashnode account is not connected in YouMind.
Go to https://youmind.com/settings/connector and connect your Hashnode account first.
```

If the plan is not eligible, the backend returns:

```text
Upgrade plan: https://youmind.com/pricing
```

## Notes

- Hashnode tag lookup is exact or slug-like, because the official API exposes exact tag lookup rather than a full fuzzy search endpoint.
- Draft review happens from the Hashnode dashboard associated with your publication.
- The skill no longer reads local `hashnode.token` or `hashnode.publication_id`.
