# YouMind Beehiiv Skill

AI-powered Beehiiv writing and publishing through YouMind.

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
- `~/.youmind/config/youmind-beehiiv-article.yaml`
- `~/.youmind/config.yaml`

Before publishing, connect Beehiiv in YouMind Connector Settings.

## CLI

```bash
cd toolkit

npx tsx src/cli.ts validate
npx tsx src/cli.ts templates
npx tsx src/cli.ts preview ../output/article.md
npx tsx src/cli.ts publish ../output/article.md --tags "ai,newsletter" --post-template-id post_template_xxx
npx tsx src/cli.ts update post_xxx ../output/article.md --tags "ai,newsletter"
npx tsx src/cli.ts list --status draft --platform both --hidden-from-feed false
```

## Notes

- Publishing uses HTML, not raw Markdown.
- Default publish mode is `draft`.
- `templates` maps to Beehiiv `post_templates` and is the recommended way to discover usable `postTemplateId` values.
- `publish` supports Beehiiv template IDs plus advanced `recipients / emailSettings / webSettings / seoSettings` JSON payloads.
- Beehiiv may reject post creation with `403` if the publication lacks Send API access.
- Beehiiv currently documents `update post` as beta/Enterprise.
