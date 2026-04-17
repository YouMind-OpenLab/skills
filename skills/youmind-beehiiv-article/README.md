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
npx tsx src/cli.ts preview ../output/article.md
npx tsx src/cli.ts publish ../output/article.md --tags "ai,newsletter"
npx tsx src/cli.ts list --status draft
```

## Notes

- Publishing uses HTML, not raw Markdown.
- Default publish mode is `draft`.
- Beehiiv may reject post creation with `403` if the publication lacks Send API access.
