# Hashnode Article Pipeline

## Step 1: Load Config

1. Read `youmind.api_key` and `youmind.base_url` from local `config.yaml`
2. Keep all public-facing examples on `https://youmind.com/openapi/v1`
3. If local backend testing is needed, override only the local `config.yaml`
3. Do not ask for local `hashnode.token` or `hashnode.publication_id`

## Step 2: Validate Backend Readiness

1. Run `node dist/cli.js validate`
2. If the backend says Hashnode is not connected, send the user to `https://youmind.com/settings/connector`
3. If the backend says the plan is not eligible, send the user to `https://youmind.com/pricing`

## Step 3: Research and Material Gathering

1. Search YouMind knowledge base when relevant
2. Search the web when current information matters
3. Identify a strong technical angle and useful code examples

## Step 4: Adapt Content for Hashnode

1. Build a title with clear search intent
2. Add or generate a subtitle
3. Limit to 5 tags
4. Add meta description
5. Validate code block language tags
6. Run `adaptForHashnode()`

## Step 5: Local Draft Output

If you need a local copy, write it under `output/` only.

Examples:

- `output/my-article.hashnode.md`
- `output/graphql-api-design.hashnode.md`

## Step 6: Publish

Default behavior:

```bash
node dist/cli.js publish ../article.md --draft
```

Immediate publish only when the user explicitly asks:

```bash
node dist/cli.js publish ../article.md --publish
```

Useful management commands:

```bash
node dist/cli.js list-drafts --page 1 --limit 10
node dist/cli.js list-published --page 1 --limit 10
node dist/cli.js publish-draft <draft_id>
node dist/cli.js get-draft <draft_id>
node dist/cli.js get-post <post_id>
```

## Step 7: Report Back

For drafts:

- clearly say it is a draft
- show the dashboard URL when returned

For published posts:

- show the public URL
- include the post ID and slug

For failures:

- keep the error message intact if it already contains connector or pricing guidance
- do not replace backend errors with generic local messages
