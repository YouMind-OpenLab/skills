# YouMind Medium Article Writer

Write and publish polished Medium articles with AI.

> **Important:** Medium's Publishing API is officially deprecated but still functional. This skill supports **article creation only** -- no updates, deletes, or listing via API. Once published, edits must be made through the Medium web interface.

## Quick Start

```bash
# 1. Install
cd toolkit && npm install && npm run build && cd ..

# 2. Configure
cp config.example.yaml config.yaml
# Edit config.yaml with your API keys

# 3. Validate
cd toolkit && npx tsx src/cli.ts validate && cd ..

# 4. Publish
cd toolkit && npx tsx src/cli.ts publish ../my-article.md --draft && cd ..
```

## Configuration

Get your tokens:
- **YouMind API Key** (recommended): https://youmind.com/settings/api-keys
- **Medium Integration Token** (required): https://medium.com/me/settings/security

## CLI Commands

| Command | Description |
|---------|-------------|
| `publish <file>` | Publish a markdown file to Medium |
| `preview <file>` | Preview content adaptation (no publishing) |
| `validate` | Check token and get user info |
| `publications` | List your Medium publications |

### Publish Options

```bash
npx tsx src/cli.ts publish article.md --draft          # Save as draft (default)
npx tsx src/cli.ts publish article.md --public         # Publish publicly
npx tsx src/cli.ts publish article.md --unlisted       # Publish as unlisted
npx tsx src/cli.ts publish article.md --tags "ai,writing,productivity"
npx tsx src/cli.ts publish article.md --publication "pub-id-here"
npx tsx src/cli.ts publish article.md --canonical-url "https://myblog.com/post"
```

## API Limitations

Medium's API only supports:
- Creating articles (POST)
- Getting authenticated user info (GET)
- Getting user's publications (GET)

**Not available:** Update articles, delete articles, list articles, analytics.

## Part of YouMind Article Dispatch

This skill is part of the [youmind-article-dispatch](https://youmind.com/skills?utm_source=youmind-medium-article) system for multi-platform publishing.
