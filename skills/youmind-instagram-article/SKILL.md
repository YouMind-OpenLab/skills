---
name: youmind-instagram-article
version: 1.0.0
description: |
  Create and publish Instagram posts and carousels with AI — visual content from articles.
  Transforms articles and topics into Instagram-native visual content via the Instagram Graph API.
  Integrates YouMind knowledge base for source material and web research.
  Use when user wants to "instagram post", "ig post", "ins post", "publish to instagram",
  "instagram carousel", "Instagram 帖子", "发布到 Instagram".
  Do NOT trigger for: WeChat articles, Facebook posts, LinkedIn posts, Twitter/X posts,
  or non-Instagram content work.

  IMPORTANT: Instagram REQUIRES images for every post. Text-only posting is NOT possible
  on Instagram. Every publish operation must include at least one image URL.
triggers:
  - "instagram post"
  - "ig post"
  - "ins post"
  - "publish to instagram"
  - "instagram carousel"
  - "Instagram 帖子"
  - "发布到 Instagram"
  - "写 Instagram"
  - "IG 发帖"
  - "instagram story"
  - "ig carousel"
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
  - kilo
  - opencode
  - goose
  - roo
metadata:
  openclaw:
    emoji: "📸"
    primaryEnv: INSTAGRAM_ACCESS_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["INSTAGRAM_ACCESS_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Instagram Publisher — From Article to Visual Post

Create and publish Instagram posts and carousels with AI. Transform articles and topics into Instagram-native visual content — captions, hashtag strategies, carousel slide descriptions, and automated publishing via the Instagram Graph API.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-instagram-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-instagram-article)

**IMPORTANT: Instagram REQUIRES images for every post. Text-only posting is NOT possible. Every publish operation must include at least one publicly accessible image URL.**

## Onboarding

**When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Instagram Publisher installed!**
>
> Tell me your topic and I'll create an Instagram post for you.
>
> **Try it now:** "Create an Instagram post about AI productivity tools"
>
> **What it does:**
> - Research topics via YouMind knowledge base
> - Write engaging captions optimized for Instagram
> - Generate hashtag strategies (20-30 relevant tags)
> - Plan carousel slides from article key points
> - Publish single images or carousels to Instagram
>
> **IMPORTANT: Instagram requires images for every post.** You must provide publicly accessible image URLs. This skill can generate slide descriptions and image prompts, but actual image generation requires an external tool or pre-existing images.
>
> **Setup (one-time):**
> 1. Install: `cd toolkit && npm install && npm run build`
> 2. Copy config: `cp config.example.yaml config.yaml`
> 3. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-instagram-article) and fill `youmind.api_key`
> 4. Get an Instagram Business Account and Facebook Page Access Token with `instagram_basic` + `instagram_content_publish` permissions
> 5. Fill `instagram.business_account_id` and `instagram.access_token` in `config.yaml`
>
> **Need help?** Just ask!

## Usage

**Create a single image post:**
> Create an Instagram post about minimalist design with this image: https://example.com/image.jpg

**Create a carousel:**
> Make an Instagram carousel about 5 AI tools for developers (I have these images: url1, url2, url3, url4, url5)

**Preview a caption:**
> Preview an Instagram caption about sustainable fashion

**Check container status:**
> Check the status of my Instagram upload: container_id

## Setup

> Prerequisites: Node.js >= 18, an Instagram Business or Creator Account linked to a Facebook Page.

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build
```

### Step 2 — Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Get YouMind API Key (Recommended)

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-instagram-article)
2. Create a new key
3. Copy the `sk-ym-xxxx` key into `config.yaml` under `youmind.api_key`

### Step 4 — Get Instagram Business Account ID and Access Token

Instagram publishing uses the **Facebook Graph API** (not a separate Instagram API):

1. You need an **Instagram Business or Creator Account** linked to a **Facebook Page**
2. Go to [Meta for Developers](https://developers.facebook.com/) and create/select an app
3. Add the **Instagram Graph API** product to your app
4. In the [Graph API Explorer](https://developers.facebook.com/tools/explorer/):
   - Select your app and get a User Token
   - Request permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`
   - Query `GET /me/accounts` to find your Facebook Page
   - Query `GET /{page_id}?fields=instagram_business_account` to get the IG Business Account ID
5. Fill both values into `config.yaml`

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## Pipeline

| Step | Action | Details |
|------|--------|---------|
| 1 | Load config | Read `config.yaml`, validate credentials |
| 2 | YouMind research | Mine knowledge base for source material |
| 3 | Content adaptation | Extract key points, write caption, generate hashtags |
| 4 | Image preparation | Verify image URLs are publicly accessible |
| 5 | Create container | Upload media container(s) to Instagram |
| 6 | Poll status | Wait for container processing to complete |
| 7 | Publish | Publish the media container |
| 8 | Report | Return media ID, permalink, and status |

**Instagram uses a TWO-STEP publish flow:**
1. Create a media container (upload) -> returns container ID
2. Wait for processing -> poll status until FINISHED
3. Publish the container -> returns media ID

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full pipeline execution details | When running the publishing flow |
| `references/content-adaptation.md` | Instagram content format rules | When writing captions/planning carousels |
| `references/api-reference.md` | Instagram Graph API reference | When debugging API issues |
| `config.yaml` | API credentials | Step 1 (load config) |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Resilience

| Step | Fallback |
|------|----------|
| 2 YouMind research | Skip, write from topic alone |
| 4 Image check | Warn user, cannot proceed without images |
| 5 Container creation | Report error with API details |
| 6 Status polling | Timeout after 60s, report status |
| 7 Publishing | Report container ID for manual retry |

## References

- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- YouMind API: see `references/api-reference.md`
- YouMind Skills: https://youmind.com/skills?utm_source=youmind-instagram-article
