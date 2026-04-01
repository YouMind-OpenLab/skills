# YouMind Ghost Skill

Ghost AI Skill. Tell the Agent what to write, and it automatically runs through topic mining, writing, HTML conversion, and publishing.

---

## What It Does

| You Say | Skill Does |
|---------|-----------|
| `Write a Ghost article about AI trends` | Full pipeline: Research → Write → Convert → Publish |
| `Publish this Markdown to Ghost` | Skip writing, convert and publish directly |
| `List my recent Ghost posts` | Fetch and display recent posts |
| `Validate my Ghost setup` | Check API credentials and connectivity |

---

## Installation

> Requirements: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config file
cp config.example.yaml config.yaml
```

Fill in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `ghost.site_url` | **Yes** | Your Ghost site URL |
| `ghost.admin_api_key` | **Yes** | Admin API Key from Ghost Admin > Settings > Integrations |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) |

### Getting a Ghost Admin API Key

1. Log into your Ghost Admin panel (`https://your-site.ghost.io/ghost/`)
2. Go to **Settings > Integrations**
3. Click **+ Add custom integration**
4. Give it a name (e.g., "YouMind Skill")
5. Copy the **Admin API Key** — it has the format `{id}:{secret}`
6. Note your **API URL** — it's shown at the bottom of the integration page

> The Admin API Key format is `{id}:{secret}` where `id` is a 24-char hex string and `secret` is a 64-char hex string, separated by a colon.

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

---

## CLI Commands

```bash
# Publish a Markdown file as draft
npx tsx src/cli.ts publish article.md --draft

# Publish immediately
npx tsx src/cli.ts publish article.md --publish

# Publish with tags
npx tsx src/cli.ts publish article.md --tags "AI,tech"

# Preview HTML conversion locally
npx tsx src/cli.ts preview article.md

# List recent posts
npx tsx src/cli.ts list --limit 10

# Validate credentials
npx tsx src/cli.ts validate
```

---

## Ghost-Specific Features

### Newsletter-Friendly Content
Ghost posts double as newsletter emails. The skill optimizes content for both web and email rendering:
- Clean, minimal HTML that renders well in email clients
- Proper excerpt generation for email previews
- Tag-based routing for newsletter segments

### Tag System
Ghost uses a flat tag system with primary and secondary tags:
- The first tag in the list is the **primary tag** (used for URL routing and template selection)
- Additional tags are secondary and used for filtering

### Feature Images
Ghost supports a dedicated feature image per post, displayed at the top of the article and in cards/previews.

---

## FAQ

**Publishing fails with 401 error** — Check that your Admin API Key is correct. It should be in `{id}:{secret}` format. Make sure the integration is active.

**JWT token errors** — The skill generates JWT tokens using Node.js crypto module. No external JWT library needed. Tokens are valid for 5 minutes and regenerated automatically.

**Images not uploading** — Ensure the Ghost instance allows image uploads and the file size is within limits (default: 5MB for Ghost Pro).

**Posts show as draft** — By default, all posts are created as drafts. Use `--publish` flag to publish immediately.

---

## License

MIT
