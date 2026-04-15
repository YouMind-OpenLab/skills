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
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
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
> 3. Connect your WordPress site at [YouMind Connector Settings](https://youmind.com/settings/connector) — paste your site URL, username, and an Application Password generated in WP Admin → Users → Profile → Application Passwords. YouMind stores them encrypted; the skill never sees them.
>
> Want to write locally first? The `preview` command works without any WordPress connection.
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

### Step 4 — Connect WordPress in YouMind (one-time, in the YouMind UI)

The skill never holds your WordPress credentials. They live encrypted in
YouMind and are attached automatically when the proxy talks to your site.

1. In your WordPress admin: **Users → Profile → Application Passwords**, add a new password named "YouMind" and copy the generated string (shown only once).
2. Open [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wordpress-article).
3. Pick **WordPress**. Paste your site URL (e.g. `https://myblog.com`), username, and the Application Password.
4. Save. YouMind validates against `/wp-json/wp/v2/users/me` immediately — a green check means the link is healthy.

To rotate or revoke: revoke the password in WP Admin, then disconnect WordPress in YouMind and reconnect with a fresh one.

### Verify Setup

```bash
cd toolkit && node dist/cli.js validate
```

You should see `OK: Connected to WordPress site as <username>`.

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
| `references/api-reference.md` | YouMind /wordpress/* OpenAPI contract | When calling the proxy from the toolkit |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `output/` | **Local article Markdown drafts (git-ignored)** | When writing the article |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Draft Location Rule (MANDATORY)

**All local article Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-wordpress-article/output/my-article.md`
- Wrong: `skills/youmind-wordpress-article/my-article.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, or the skill root

The `output/` directory is listed in `.gitignore` (as `output/*.md` / `output/*.html`), so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-post.md`), and prefer descriptive slugs over timestamps.

## References

- YouMind API: see `references/api-reference.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-wordpress-article
