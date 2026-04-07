---
name: youmind-facebook-article
version: 1.0.0
description: |
  Write and publish Facebook Page posts with AI — topic mining, research via YouMind knowledge base,
  content adaptation for Facebook's engagement-driven format, and one-click publishing to your Page.
  Integrates YouMind knowledge base for source material and web research.
  Use when user wants to "facebook post", "fb post", "publish to facebook", "facebook article",
  "Facebook 帖子", "发布到 Facebook".
  Do NOT trigger for: WeChat articles, Instagram posts, LinkedIn posts, Twitter/X posts,
  or non-Facebook content work.
triggers:
  - "facebook post"
  - "fb post"
  - "publish to facebook"
  - "facebook article"
  - "Facebook 帖子"
  - "发布到 Facebook"
  - "写 Facebook"
  - "FB 发帖"
  - "facebook page"
  - "fb page post"
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
    emoji: "📘"
    primaryEnv: FACEBOOK_PAGE_ACCESS_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["FACEBOOK_PAGE_ACCESS_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Facebook Page Publisher — From Topic to Published Post

Write and publish engaging Facebook Page posts with AI. Topic mining via YouMind knowledge base, web research for freshness, content adaptation for Facebook's algorithm, and one-click publishing via Graph API.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-facebook-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-facebook-article)

## Onboarding

**When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Facebook Page Publisher installed!**
>
> Tell me your topic and I'll write and publish a Facebook post for you.
>
> **Try it now:** "Write a Facebook post about AI trends in 2026"
>
> **What it does:**
> - Research topics via YouMind knowledge base and web search
> - Write engaging posts optimized for Facebook's algorithm
> - Support text posts, link posts, and photo posts
> - Publish directly to your Facebook Page
>
> **Setup (one-time):**
> 1. Install: `cd toolkit && npm install && npm run build`
> 2. Copy config: `cp config.example.yaml config.yaml`
> 3. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-facebook-article) and fill `youmind.api_key` in `config.yaml`
> 4. Get a Facebook Page Access Token (long-lived) from [Meta Developer Portal](https://developers.facebook.com/tools/explorer/) and fill `facebook.page_access_token` and `facebook.page_id`
>
> **Need help?** Just ask!

## Usage

**Write a post from a topic:**
> Write a Facebook post about remote work productivity tips

**Publish with a link:**
> Publish this article to Facebook with a link: https://example.com/article

**Post with an image:**
> Create a Facebook post about our new product launch with this image

**Preview without publishing:**
> Preview a Facebook post about AI coding assistants

## Setup

> Prerequisites: Node.js >= 18

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build
```

### Step 2 — Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Get YouMind API Key (Recommended)

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-facebook-article)
2. Create a new key
3. Copy the `sk-ym-xxxx` key into `config.yaml` under `youmind.api_key`

### Step 4 — Get Facebook Page Access Token

1. Go to [Meta Developer Portal](https://developers.facebook.com/)
2. Create an app or use an existing one
3. Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) to generate a Page Access Token
4. Select your Page and request `pages_manage_posts`, `pages_read_engagement` permissions
5. Generate a long-lived token and fill it into `config.yaml`

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## Pipeline

| Step | Action | Details |
|------|--------|---------|
| 1 | Load config | Read `config.yaml`, validate credentials |
| 2 | YouMind research | Mine knowledge base for source material |
| 3 | Web research | Fetch trending content and context |
| 4 | Content adaptation | Adapt content for Facebook format |
| 5 | Write post | Hook-driven, engagement-optimized copy |
| 6 | Publish | Post to Facebook Page via Graph API |
| 7 | Report | Return post ID, URL, and status |

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full pipeline execution details | When running the publishing flow |
| `references/content-adaptation.md` | Facebook content format rules | When writing/adapting content |
| `references/api-reference.md` | Facebook Graph API reference | When debugging API issues |
| `config.yaml` | API credentials | Step 1 (load config) |
| `output/` | **Local post Markdown drafts (git-ignored)** | When writing the post |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Draft Location Rule (MANDATORY)

**All local post Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-facebook-article/output/my-post.md`
- Wrong: `skills/youmind-facebook-article/my-post.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-post.md`), and prefer descriptive slugs over timestamps.

## Resilience

| Step | Fallback |
|------|----------|
| 2 YouMind research | Skip, use web search only |
| 3 Web research | Skip, write from topic alone |
| 6 Publishing | Save post text locally |

## References

- YouMind API: see `references/api-reference.md`
- Facebook Graph API: https://developers.facebook.com/docs/graph-api
- YouMind Skills: https://youmind.com/skills?utm_source=youmind-facebook-article
