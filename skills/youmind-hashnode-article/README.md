# YouMind Hashnode Skill

AI-powered Hashnode article writing and publishing. Tell your agent a topic, and it handles research, writing, SEO optimization, and publishing to your Hashnode publication.

---

## Quick Start

| You say | Skill does |
|---------|-----------|
| `Write a Hashnode article about Rust async/await` | Full pipeline: research, write, format, publish |
| `Publish this markdown to Hashnode` | Skip writing, publish directly |
| `Validate my article for Hashnode` | Check tags, structure, SEO |
| `List my Hashnode posts` | Fetch your published and draft posts |

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
| `hashnode.token` | **Yes** | Hashnode Personal Access Token from [Developer Settings](https://hashnode.com/settings/developer) |
| `hashnode.publication_id` | **Yes** | Your Hashnode publication ID |
| `youmind.api_key` | Recommended | Knowledge base search, web search, archiving. [Get key](https://youmind.com/settings/api-keys?utm_source=youmind-hashnode-article) |

---

## CLI Commands

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish article.md --tags "graphql,api"

# Preview and validate locally
npx tsx src/cli.ts preview article.md

# Validate API connectivity
npx tsx src/cli.ts validate

# List your posts
npx tsx src/cli.ts list
```

---

## Hashnode Content Guidelines

- **Title**: SEO-optimized, 50-70 characters
- **Subtitle**: compelling hook, displayed prominently
- **Tags**: up to 5, choose from existing Hashnode tags
- **Cover image**: URL, recommended 1600x840
- **Canonical URL**: always set for cross-posted content
- **Meta description**: max 160 characters for SEO

---

## License

MIT
