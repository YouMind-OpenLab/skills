# YouMind WordPress Skill

AI-powered WordPress article writing and publishing. Tell your agent a topic, and it can research, write, convert Markdown to HTML, upload featured images, and publish through the WordPress site you already connected in YouMind.

---

## What It Does

| You say | Skill does |
|---------|------------|
| `Write a blog post about AI tools for WordPress` | Research -> write -> convert to HTML -> publish as draft |
| `List my WordPress posts` | Fetch and display recent posts |
| `Upload this image to WordPress` | Upload media file to the WordPress media library |
| `Validate my WordPress setup` | Check YouMind API key and WordPress connectivity |

---

## Setup

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config (if config.yaml doesn't exist)
cp config.example.yaml config.yaml
```

`config.yaml` only needs the YouMind API key:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Commands read `youmind.api_key` and `youmind.base_url` from local `config.yaml`.
Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change only your local `config.yaml`.

### Publishing prerequisite

All WordPress credentials (site URL + username + Application Password) are configured once inside YouMind -> Connector Settings for WordPress. This skill only needs `youmind.api_key`.

Before publishing, open [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wordpress-article), pick **WordPress**, paste your site URL, username, and an Application Password generated in WP Admin -> Users -> Profile -> Application Passwords. YouMind stores them encrypted and validates against `/wp-json/wp/v2/users/me` on save.

The skill no longer reads `wordpress.site_url`, `wordpress.username`, or `wordpress.app_password` locally and should never ask the user to paste WordPress credentials into this repo. To rotate a password: revoke it in WP Admin, then disconnect and reconnect WordPress in YouMind.

### Get a YouMind API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article), create a key, and place it in `youmind.api_key`.

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

You should see `OK: Connected to WordPress site as <username>`.

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

> **Get YouMind API Key:** [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article)

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

**Q: What is WordPress? What do I need?**

WordPress is a **server-side web application** (PHP + MySQL), not a desktop app. You need a **running WordPress site** accessible at `https://<your-domain>` — managed hosting (SiteGround, Bluehost, DigitalOcean, etc.) is the easiest path; self-hosted LAMP/LEMP also works. Version 5.6+ with the REST API enabled is required.

**Q: I get a 401 or auth error**

Check `youmind.api_key` in `config.yaml`. The skill now authenticates only with YouMind. If YouMind itself returns "WordPress not connected" or a proxy auth failure, reopen [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wordpress-article), re-enter your WP site URL / username / Application Password, and save. YouMind validates against `/wp-json/wp/v2/users/me` on save.

**Q: I don't see the Application Passwords section in WP Admin**

Application Passwords requires WordPress 5.6+ over HTTPS, with the REST API not blocked by a security plugin.

| Cause | Fix |
|-------|-----|
| Site runs on `http://` | Add `define( 'WP_ENVIRONMENT_TYPE', 'local' );` to `wp-config.php`, then reload the profile page |
| WordPress below 5.6 | Upgrade, or install the "Application Passwords" plugin |
| Security plugin blocking it | Check Wordfence / iThemes Security settings |
| Hosting restriction | Contact your host |

**Q: YouMind connected fine, but publishing times out**

Usually means the site's Nginx or firewall is blocking POST requests from outside. Verify POST works locally on the server:

```bash
curl -s -X POST "https://<your-domain>/wp-json/wp/v2/posts" \
  -u "<username>:<app_password>" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","content":"hello","status":"draft"}'
```

If local POST works but the YouMind proxy still hangs, check Nginx (`client_max_body_size 10m;`, allow POST) and cloud security group rules (AWS / GCP / Tencent / Ali) so inbound POST traffic is not filtered.

**Q: Images won't upload**

Make sure the WP user you linked has the `upload_files` capability. Admin and Editor roles have it by default.

**Q: REST API not accessible**

Some security plugins disable `/wp-json/`. Visit `https://<your-domain>/wp-json/wp/v2/posts` in a browser — if it 403s, adjust the plugin's REST API allowlist.

**Q: Can I still preview locally without a WordPress connection?**

Yes. `preview` only depends on the local Markdown-to-HTML conversion.

---

## License

MIT
