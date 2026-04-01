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

> Application Passwords is a built-in REST API authentication method in WordPress 5.6+. No extra plugins needed.
>
> Prerequisites: WordPress 5.6+, HTTPS enabled (or workaround below), REST API not blocked by security plugins.

**Step 1 -- Open the WordPress Login Page**

Visit your WordPress login page in a browser:

```
https://<your-domain>/wp-login.php
```

Replace `<your-domain>` with your actual domain. Log in with an **admin** or **editor** account.

**Step 2 -- Go to User Profile**

In the **left sidebar**, click **Users** -> **Profile**.

Or go directly to:

```
https://<your-domain>/wp-admin/profile.php
```

**Step 3 -- Find Application Passwords**

**Scroll to the bottom** of the profile page to find the **"Application Passwords"** section.

> **Can't find it?** Possible causes:
> - **Site uses `http://` instead of `https://`** -- WordPress only shows this feature over HTTPS. Workaround: edit `wp-config.php` in your WordPress root directory and add this line **before** `/* That's all, stop editing! */`:
>   ```php
>   define( 'WP_ENVIRONMENT_TYPE', 'local' );
>   ```
>   Save and refresh the profile page.
> - WordPress version below 5.6 -- check your version under **Dashboard -> Updates**
> - Security plugins (e.g. Wordfence, iThemes Security) disabled it -- check plugin settings
> - Hosting restriction -- contact your hosting provider

**Step 4 -- Create a New Password**

1. Enter a name in the **"New Application Password Name"** field (e.g., `youmind`)
2. Click **"Add New Application Password"**

**Step 5 -- Copy the Password**

A password will be generated (format like `abcd EFGH 1234 ijkl MNOP 5678`), shown in a blue box.

- **This password is shown only once** -- copy it immediately
- Spaces in the password can be kept or removed; WordPress handles both

**Step 6 -- Note Your Username**

At the **top** of the profile page, find the **"Username"** field (greyed out, not editable).

> **Important:** You need the WordPress **username** (e.g., `admin`), not the display name or email address.

**Step 7 -- Fill in Config**

Add these three values to `config.yaml`:

```yaml
wordpress:
  site_url: "https://<your-domain>"     # Your site URL (no trailing /)
  username: "admin"                       # Username from Step 6
  app_password: "abcd EFGH 1234 ijkl"    # Password from Step 5
```

> **Common mistakes:**
> - `site_url` should not have a trailing slash: `https://myblog.com` not `https://myblog.com/`
> - 401 error after filling in password -- check if you used an email instead of username, or if the password has extra newlines
> - Forgot to copy the password -- go back to the profile page, revoke the old one, and create a new one

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

### What Is WordPress? What Do I Need?

WordPress is not a desktop application -- it's a **server-side web application** (PHP + MySQL). You need a **running WordPress site** accessible via `https://<your-domain>`, not just the downloaded source code directory.

How to get one:
- **Managed hosting** (easiest): Buy WordPress hosting from SiteGround, Bluehost, DigitalOcean, etc. -- one-click setup
- **Self-hosted**: Set up a LAMP/LEMP stack on your own server and deploy WordPress

### Application Passwords Section Missing

| Cause | Solution |
|-------|----------|
| Site uses `http://` instead of `https://` | Add `define( 'WP_ENVIRONMENT_TYPE', 'local' );` to `wp-config.php`, then refresh |
| WordPress version below 5.6 | Upgrade WordPress, or install the "Application Passwords" plugin |
| Security plugin blocking it | Check Wordfence / iThemes Security settings |
| Hosting restriction | Contact your hosting provider |

### Publishing Fails with 401 Error

- Make sure `username` is your WordPress **username** (e.g., `admin`), not your email or display name
- Check `app_password` for extra spaces or newline characters
- Verify the application password hasn't been revoked (check the profile page)

### `validate` Passes but `publish` Times Out

This is the most common deployment blocker. `validate` (GET request) works fine, but `publish` (POST request) hangs indefinitely.

**Root cause:** The server's Nginx or firewall is blocking POST requests.

**Troubleshooting:**

1. Test POST locally on the server:
   ```bash
   curl -s -X POST "http://localhost:8080/wp-json/wp/v2/posts" \
     -u "username:app_password" \
     -H "Content-Type: application/json" \
     -d '{"title":"test","content":"hello","status":"draft"}'
   ```
   If this works but external POST fails, it's a firewall/Nginx issue.

2. Check Nginx config -- ensure POST method is allowed and request body size is sufficient:
   ```nginx
   client_max_body_size 10m;
   ```

3. Check cloud provider security group rules (AWS, GCP, Tencent Cloud, etc.) -- ensure inbound rules allow POST requests on the relevant port.

### Images Not Uploading

Ensure the WordPress user has `upload_files` capability. Admin and Editor roles have this by default.

### REST API Not Accessible

Some security plugins may disable the REST API. Check your security plugin settings and ensure the `/wp-json/wp/v2/` endpoint is reachable. Test by visiting `https://<your-domain>/wp-json/wp/v2/posts` in a browser.

---

## License

MIT
