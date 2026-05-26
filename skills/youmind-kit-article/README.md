# YouMind Kit Skill

AI-powered Kit writing and publishing through YouMind.

## Setup

```bash
cd toolkit && npm install && npm run build && cd ..
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

Put only this in `~/.youmind/config.yaml`:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Commands resolve config in this order:
- `~/.youmind/config/youmind-kit-article.yaml`
- `~/.youmind/config.yaml`

Before publishing, connect Kit in YouMind Connector Settings.
Also make sure the sender email you expect Kit to use is already confirmed in Kit.

## CLI

```bash
cd toolkit

npx tsx src/cli.ts validate
npx tsx src/cli.ts templates --per-page 100
npx tsx src/cli.ts preview ../output/article.md
npx tsx src/cli.ts publish ../output/article.md --public
npx tsx src/cli.ts list --per-page 20
npm run deep-check
```

## Notes

- Publishing uses HTML, not raw Markdown.
- Default mode is web-public.
- Use `templates` to discover valid `email_template_id` values before publishing.
- Use `--private` if the user wants to keep the post off the public feed.
- Private drafts can be inspected in Kit at `https://app.kit.com/campaigns`.
- Kit can reject createBroadcast when the sender email address is not yet confirmed.
- `npm run deep-check` exercises direct Kit OpenAPI, generic token-platform publishing, and the skill CLI with cleanup.
