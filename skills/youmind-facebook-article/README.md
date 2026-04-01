# YouMind Facebook Skill

AI-powered Facebook Page post publisher. Researches topics via YouMind knowledge base, adapts content for Facebook's engagement-driven format, and publishes directly to your Page via Graph API.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Post about AI trends to my Facebook Page` | Research → write → adapt for Facebook → publish |
| `Share this link with commentary` | Create link post with engagement-optimized text |
| `Publish with an image about our product launch` | Create image post with caption |

---

## Installation

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config file
cp config.example.yaml config.yaml
```

Fill in your credentials in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `facebook.page_id` | **Yes** | Your Facebook Page ID |
| `facebook.page_access_token` | **Yes** | Extended Page Access Token |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-facebook-article) |

---

## Getting Credentials

### Step 1 — Visit Facebook Developer Portal

Go to [Facebook Developer Portal](https://developers.facebook.com/) and sign in with your Facebook account.

### Step 2 — Create an App

Click **"Create App"** and select **Business** as the app type.

### Step 3 — Add Facebook Login Product

In the App Dashboard, find and add the **"Facebook Login"** product.

### Step 4 — Get Page Access Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. Select your newly created app from the app dropdown in the top right

3. Click **"Get User Access Token"** and check these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`

4. Click **"Generate Access Token"** and complete the authorization flow

5. In the User or Page dropdown, select your **Page** to get the Page Access Token

### Step 5 — Extend Token Lifetime (Recommended)

The default token has a short lifetime. To extend:

1. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

2. Paste your Page Access Token and click **"Debug"**

3. Click **"Extend Access Token"** at the bottom (extends to 60 days)

### Step 6 — Fill in Config

Fill credentials into `config.yaml`:

```yaml
facebook:
  page_id: "your Facebook Page ID"
  page_access_token: "your extended Page Access Token"
```

### Important Notes

- Token expires after **60 days** at most; you need to regenerate it after expiration.
- Find your Page ID in Facebook Page → "About" → "Page ID".

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

> **Get API Key:** [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch)

---

## Usage Tips

### Post Types

- **Text Post**: Pure text content, great for opinions
- **Link Post**: Share a link with commentary
- **Image Post**: Post with image, boosts engagement

### CLI Commands

```bash
cd toolkit

# Validate credentials
npx tsx src/cli.ts validate

# Publish a text post
npx tsx src/cli.ts publish "Your post content here"

# Publish with a link
npx tsx src/cli.ts publish "Check out this article" --link https://example.com

# Publish with an image
npx tsx src/cli.ts publish "Great photo!" --with-image https://example.com/photo.jpg

# Preview formatted post
npx tsx src/cli.ts preview "Your draft post content"

# List recent posts
npx tsx src/cli.ts list
```

---

## FAQ

**Token expired error** — Page Access Token lasts 60 days max. Re-follow the "Getting Credentials" steps to generate a new one.

**Permission error on publish** — Ensure your token has `pages_manage_posts` permission and you selected a Page Token, not a User Token.

**Can't find Page ID** — Open your Facebook Page → "About" → Page ID is at the bottom.

**Low post engagement** — Facebook's algorithm favors original long-form and image content. Avoid link-only posts when possible.

---

## License

MIT
