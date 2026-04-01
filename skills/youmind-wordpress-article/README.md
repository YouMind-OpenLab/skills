# YouMind WordPress Skill

WordPress AI Skill. Tell the Agent what to write, and it automatically runs through topic mining, writing, HTML conversion, and publishing.

---

## What It Does

| You Say | Skill Does |
|---------|-----------|
| `Write a WordPress article about AI trends` | Full pipeline: Research → Write → Convert → Publish |
| `Publish this Markdown to WordPress` | Skip writing, convert and publish directly |
| `List my recent WordPress posts` | Fetch and display recent posts |
| `Validate my WordPress setup` | Check API credentials and connectivity |

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
| `wordpress.site_url` | **Yes** | Your WordPress site URL |
| `wordpress.username` | **Yes** | WordPress username |
| `wordpress.app_password` | **Yes** | Application Password from Users > Profile |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article) |

### Getting a WordPress Application Password

1. Log into your WordPress admin dashboard
2. Go to **Users > Profile**
3. Scroll down to **Application Passwords**
4. Enter a name (e.g., "YouMind Skill") and click **Add New Application Password**
5. Copy the generated password (shown only once)

> Note: Application Passwords require WordPress 5.6+ and HTTPS. Some hosting providers may disable this feature — check with your host if the section doesn't appear.

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

# Publish with tags and category
npx tsx src/cli.ts publish article.md --tags "AI,tech" --category "Technology"

# Preview HTML conversion locally
npx tsx src/cli.ts preview article.md

# List recent posts
npx tsx src/cli.ts list --per-page 10

# Upload a media file
npx tsx src/cli.ts upload-media cover.jpg

# Validate credentials
npx tsx src/cli.ts validate
```

---

## FAQ

**Publishing fails with 401 error** — Check that your username and application password are correct. Make sure the password has no extra spaces.

**Application Passwords section missing** — Your WordPress version may be too old (requires 5.6+) or your hosting provider disabled it. Try installing the "Application Passwords" plugin as a fallback.

**Images not uploading** — Ensure the WordPress user has `upload_files` capability. Admin and Editor roles have this by default.

---

## License

MIT
