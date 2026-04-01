---
name: youmind-wordpress-article
version: 1.0.0
description: |
  Write and publish WordPress articles end-to-end with AI — topic mining via YouMind knowledge base,
  de-AI voice writing, Markdown-to-HTML conversion, featured image upload, and one-click publishing.
  Use when user wants to "wordpress article", "publish to wordpress", "wp article", "wp post",
  "WordPress 文章", "发布到 WordPress".
  Do NOT trigger for: WeChat articles, Ghost posts, emails/newsletters, PPT, short video scripts.
triggers:
  - "wordpress article"
  - "publish to wordpress"
  - "wp article"
  - "wp post"
  - "WordPress 文章"
  - "发布到 WordPress"
  - "写 WordPress 文章"
  - "WordPress 博客"
  - "WP 发布"
  - "write wordpress"
  - "wordpress publish"
  - "wordpress blog"
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
    emoji: "📰"
    primaryEnv: WORDPRESS_APP_PASSWORD
    requires:
      anyBins: ["node", "npm"]
      env: ["WORDPRESS_APP_PASSWORD"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
  - Bash([ -n "$WORDPRESS_APP_PASSWORD" ] *)
---

# AI WordPress Article Writer — From Topic to Published Post in One Prompt

Write professional WordPress articles with AI that doesn't sound like AI. Topic mining via [YouMind](https://youmind.com?utm_source=youmind-wordpress-article) knowledge base → deep research → structured writing → Markdown-to-HTML conversion → featured image upload → one-click publishing to WordPress. No manual formatting, no copy-paste.

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article) · [More Skills →](https://youmind.com/skills?utm_source=youmind-wordpress-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI WordPress Article Writer installed!**
>
> Tell me your topic and I'll write and publish a WordPress article for you.
>
> **Try it now:** "Help me write a WordPress article about AI programming trends"
>
> **What it does:**
> - Mine topics from YouMind knowledge base and web search
> - Write professional articles with de-AI voice
> - Convert Markdown to clean HTML
> - Upload featured images
> - Publish directly to your WordPress site (as draft or published)
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article) → fill `youmind.api_key` in `config.yaml`
> 3. Get WordPress Application Password from Users > Profile > Application Passwords → fill `wordpress.app_password`, `wordpress.username`, and `wordpress.site_url` in `config.yaml`
>
> No WordPress API yet? You can still write and preview locally — just skip the WordPress config steps.
>
> See the **Setup** section below for detailed instructions.
>
> **Need help?** Just ask!

## Usage

Provide a topic or raw Markdown for publishing.

**Write from a topic:**
> Help me write a WordPress article about AI programming trends

**Publish raw Markdown:**
> Publish this Markdown file to WordPress as a draft

**List recent posts:**
> Show my recent WordPress posts

## Setup

> Prerequisites: Node.js >= 18

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 — Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Get YouMind API Key (Recommended)

1. Open [YouMind API Keys page](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill into `config.yaml` under `youmind.api_key`

### Step 4 — Get WordPress Application Password

1. Log into your WordPress admin dashboard
2. Go to **Users > Profile**
3. Scroll to **Application Passwords**
4. Enter a name (e.g., "YouMind Skill") and click **Add New Application Password**
5. Copy the generated password (shown only once)
6. Fill into `config.yaml`

```yaml
wordpress:
  site_url: "https://myblog.com"
  username: "your-username"
  app_password: "xxxx xxxx xxxx xxxx xxxx xxxx"
```

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## Pipeline Overview

Read `references/pipeline.md` for full execution details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate credentials | — |
| 2 | Mine YouMind knowledge base for source material | `api-reference.md` |
| 3 | Research topic via web search | — |
| 4 | Adapt content structure for WordPress | `content-adaptation.md` |
| 5 | Write article in Markdown | — |
| 6 | Convert to HTML and publish | `pipeline.md` |
| 7 | Report results: title, URL, post ID, status | — |

## Resilience: Never Stop on a Single-Step Failure

Every step has a fallback. If a step AND its fallback both fail, skip that step and note it in the final output.

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty knowledge_context |
| 3 Web research | Ask user for manual input |
| 6 Publishing | Generate local HTML preview |

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution | When running the writing pipeline |
| `references/content-adaptation.md` | WordPress-specific writing rules | When adapting content |
| `references/api-reference.md` | WordPress REST API endpoints | When calling WordPress API |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## References

- YouMind API: see `references/api-reference.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-wordpress-article
