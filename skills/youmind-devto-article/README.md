# YouMind Dev.to Skill

AI-powered Dev.to article writing and publishing. Tell your agent a topic, and it handles research, writing, formatting, and publishing.

---

## Quick Start

| You say | Skill does |
|---------|-----------|
| `Write a Dev.to article about Rust error handling` | Full pipeline: research, write, format, publish |
| `Publish this markdown to Dev.to` | Skip writing, publish directly |
| `Validate my article for Dev.to` | Check tags, front matter, code blocks |
| `List my Dev.to articles` | Fetch your published and draft articles |

---

## Installation

> Requires: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config
cp config.example.yaml config.yaml

# 3. Fill in API keys in config.yaml
```

### Required Config

| Field | Required | Description |
|-------|----------|-------------|
| `devto.api_key` | **Yes** | Dev.to API key from [Settings > Extensions](https://dev.to/settings/extensions) |
| `youmind.api_key` | Recommended | Knowledge base search, web search, archiving. [Get key](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article) |

---

## CLI Commands

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish article.md --tags "typescript,webdev"

# Preview and validate locally
npx tsx src/cli.ts preview article.md

# Validate API connectivity
npx tsx src/cli.ts validate

# List your articles
npx tsx src/cli.ts list --page 1
```

---

## Dev.to Content Guidelines

- **TL;DR** at the top of every article
- **Code blocks** must have language tags
- **Max 4 tags**, lowercase, alphanumeric + hyphens
- **Title**: 60-80 characters, keyword-front-loaded
- **Description**: max 170 characters for SEO
- **No marketing language** -- write developer-to-developer

---

## License

MIT
