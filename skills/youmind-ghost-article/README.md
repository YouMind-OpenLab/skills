# YouMind Ghost Skill

Ghost AI Skill. Tell the Agent what to write, and it automatically runs through research, writing, HTML conversion, and publishing to your Ghost blog.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write a Ghost article about AI trends` | Full pipeline: Research -> Write -> Convert -> Publish draft |
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

Fill in the following credentials in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `ghost.site_url` | **Yes** | Your Ghost site URL (e.g. `https://myblog.ghost.io`) |
| `ghost.admin_api_key` | **Yes** | Admin API Key in `{id}:{secret}` format |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving -> [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) |

---

## Getting Credentials

### Getting a Ghost Admin API Key

> Ghost Admin panel: `yourdomain.com/ghost`

**Step 1 -- Log into Ghost Admin**

Open your browser, go to `https://yourdomain.com/ghost` (or `https://yourdomain.ghost.io/ghost`), and log in with your admin account.

**Step 2 -- Go to Integrations**

Click the gear icon at the bottom-left to go to **Settings**, then find **Integrations**.

**Step 3 -- Add Custom Integration**

Click the **"Add custom integration"** button.

**Step 4 -- Name and Create**

Enter a name for the integration (e.g., `YouMind Publisher`), then click **Create**.

**Step 5 -- Copy the Admin API Key**

In the integration detail page, find the **"Admin API Key"** field. Copy this key and paste it into the `ghost.admin_api_key` field in `config.yaml`.

> **Note:**
> - Admin API Key format must be `id:secret`, separated by a colon
> - `id` is a 24-char hex string, `secret` is a 64-char hex string
> - API URL is shown at the bottom of the integration page -- ensure it matches `ghost.site_url`

**Step 6 -- Fill in Site URL**

Enter your Ghost site URL in `ghost.site_url` (e.g., `https://myblog.ghost.io`).

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

---

## YouMind Integration

This skill integrates with [YouMind](https://youmind.com) knowledge base to enhance content quality.

| Feature | Description |
|---------|-------------|
| Semantic Search | Search your library for related articles, notes, bookmarks as research material |
| Web Search | Search the web for real-time info and trending topics |
| Article Archiving | Save published articles back to YouMind for future reference |
| Material Mining | Browse boards and extract materials for content creation |
| Board Management | List and view your boards and materials |

> **Get YouMind API Key:** [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch)

---

## Usage Tips

### CLI Commands

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

### Ghost-Specific Features

- **Newsletter-Friendly Content** -- Ghost posts double as newsletter emails. The skill optimizes content for both web and email rendering
- **Tag System** -- Ghost uses a flat tag system -- the first tag is the primary tag (used for URL routing), additional tags are secondary
- **Feature Images** -- Ghost supports a dedicated feature image per post, displayed at the top and in card previews

---

## FAQ

**Publishing fails with 401 error** -- Check that your Admin API Key is correct. It should be in `{id}:{secret}` format. Make sure the integration is active.

**JWT token errors** -- The skill generates JWT tokens using Node.js crypto module. No external JWT library needed. Tokens are valid for 5 minutes and regenerated automatically.

**Images not uploading** -- Ensure the Ghost instance allows image uploads and the file size is within limits (default: 5MB for Ghost Pro).

**Posts show as draft** -- By default, all posts are created as drafts. Use the `--publish` flag to publish immediately.

**API Key format error** -- The Admin API Key must contain both id and secret separated by a colon. If you missed the colon or only copied part of it, go back to Ghost Admin to copy the full key.

---

## License

MIT
