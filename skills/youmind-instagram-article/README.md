# YouMind Instagram Skill

AI-powered Instagram post and carousel publisher. Transforms articles and topics into Instagram-native visual content with optimized captions, hashtag strategies, and automated publishing via the Instagram Graph API.

**IMPORTANT: Every Instagram post requires an image -- text-only posting is not supported.**

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Post about AI trends on Instagram` | Research → write caption → generate image → publish |
| `Create a carousel about Docker tips` | Write → split into carousel slides → publish |
| `Preview a caption about remote work` | Generate optimized caption with hashtags |

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
| `instagram.business_account_id` | **Yes** | Instagram Business Account ID |
| `instagram.access_token` | **Yes** | Access Token with `instagram_basic` + `instagram_content_publish` permissions |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving → [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-instagram-article) |

---

## Getting Credentials

### Prerequisites

- **Instagram Business or Creator account** (personal accounts do not support the API)
- The Instagram account must be **linked to a Facebook Page**

### Step 1 — Visit Facebook Developer Portal

Go to [Facebook Developer Portal](https://developers.facebook.com/) and sign in with your Facebook account.

### Step 2 — Create an App

Click **"Create App"** and select **Business** as the app type.

### Step 3 — Add Instagram Graph API Product

In the App Dashboard, find and add the **"Instagram Graph API"** product.

### Step 4 — Get Access Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. Select your newly created app from the app dropdown in the top right

3. Click **"Get User Access Token"** and check these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`

4. Click **"Generate Access Token"** and complete the authorization flow

### Step 5 — Get Instagram Business Account ID

In the Graph API Explorer, make the following request:

```
GET /me/accounts?fields=instagram_business_account
```

Copy the `instagram_business_account.id` from the response.

### Step 6 — Fill in Config

Fill credentials into `config.yaml`:

```yaml
instagram:
  business_account_id: "your Instagram Business Account ID"
  access_token: "your Access Token"
```

### Important Notes

- **Only Business/Creator accounts are supported** -- personal accounts cannot use the Instagram Graph API.
- **Every post must include an image** -- Instagram does not support text-only publishing.
- **Token expires after 60 days** -- refresh periodically by repeating Step 4.

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

### Instagram Two-Step Publishing

Instagram API uses a two-step publish flow, which the Skill handles automatically:

1. **Create Container**: Upload image and caption, create a media container
2. **Poll Status**: Wait for Instagram to process media (status becomes `FINISHED`)
3. **Publish**: Publish the processed container

For carousels, each image is first uploaded as a child container, then combined into a carousel container before publishing.

### CLI Commands

```bash
cd toolkit

# Validate credentials
npx tsx src/cli.ts validate

# Publish a single image post
npx tsx src/cli.ts publish "Your caption here" --image-url https://example.com/photo.jpg

# Publish a carousel
npx tsx src/cli.ts carousel "Carousel caption" --images https://img1.jpg https://img2.jpg https://img3.jpg

# Preview a caption
npx tsx src/cli.ts preview "Your draft caption"

# List recent media
npx tsx src/cli.ts list

# Check container processing status
npx tsx src/cli.ts status <container_id>
```

---

## FAQ

**"Instagram account not found" error** — Ensure your Instagram account is Business/Creator type and linked to a Facebook Page.

**Token expired error** — Access Token lasts 60 days. Re-follow Step 4 in "Getting Credentials" to regenerate.

**"Image URL not reachable" on publish** — Instagram requires publicly accessible image URLs. Ensure the image URL is accessible without authentication.

**Can I use a personal account?** — No. The Instagram Graph API only supports Business and Creator accounts. Switch your account type in Instagram settings first.

**Maximum carousel images** — Instagram carousels support up to 10 images.

---

## License

MIT
