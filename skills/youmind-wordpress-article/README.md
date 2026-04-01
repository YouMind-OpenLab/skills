# YouMind WordPress Skill

WordPress AI Skill. Tell the Agent what to write, and it automatically runs through research, writing, HTML conversion, image upload, and publishing to your WordPress site.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write a blog post about AI tools for WordPress` | Research -> write -> convert to HTML -> publish as draft |
| `List my WordPress posts` | Fetch and display recent posts |
| `Upload this image to WordPress` | Upload media file to WordPress media library |
| `Validate my WordPress setup` | Check API credentials and connectivity |

---

## Getting Credentials

### Getting a WordPress Application Password

> WordPress admin panel: `yourdomain.com/wp-admin`

**Step 1 -- Log into WordPress Admin**

Open your browser, go to `https://yourdomain.com/wp-admin`, and log in with your admin account.

**Step 2 -- Go to User Profile**

In the left sidebar, click **Users -> Profile**.

**Step 3 -- Find Application Passwords**

Scroll down the page to find the **"Application Passwords"** section.

**Step 4 -- Create a New Password**

Enter a name in the "New Application Password Name" field (e.g., `youmind`), then click **"Add New Application Password"**.

**Step 5 -- Copy the Password**

The system will generate a password and show it only once. **Copy it immediately** and paste it into the `wordpress.app_password` field in `config.yaml`.

**Step 6 -- Fill in Remaining Config**

- `wordpress.username` -- Your WordPress login username
- `wordpress.site_url` -- Your site URL (e.g., `https://myblog.com`)

> **Note:**
> - Requires WordPress 5.6+ with REST API enabled
> - Site must use HTTPS
> - Some hosting providers may disable this feature -- contact your host if the Application Passwords section doesn't appear

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

---

## Installation

> Requirements: Node.js >= 18, WordPress 5.6+ (REST API must be enabled)

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config file
cp config.example.yaml config.yaml
```

Fill in the following credentials in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `wordpress.site_url` | **Yes** | Your WordPress site URL (e.g. `https://myblog.com`) |
| `wordpress.username` | **Yes** | WordPress username |
| `wordpress.app_password` | **Yes** | Application Password (see below) |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving -> [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article) |

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

### Content Tips

- **Let the Agent pick a topic** -- Just say "write a post about XX" and the skill will research before writing
- **Specify publishing status** -- Defaults to draft; add `--publish` to go live immediately
- **Image upload** -- Supports uploading images to WordPress media library as featured images
- **Tags and categories** -- Use `--tags` and `--category` for precise categorization

---

## FAQ

**Publishing fails with 401 error** -- Check that your username and application password are correct. Make sure the password has no extra spaces.

**Application Passwords section missing** -- Your WordPress version may be too old (requires 5.6+) or your hosting provider disabled it. Try installing the "Application Passwords" plugin as a fallback.

**Images not uploading** -- Ensure the WordPress user has `upload_files` capability. Admin and Editor roles have this by default.

**REST API not accessible** -- Some security plugins may disable the REST API. Check your security plugin settings and ensure the `/wp-json/wp/v2/` endpoint is accessible.

---

## License

MIT
