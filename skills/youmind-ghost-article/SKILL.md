---
name: youmind-ghost-article
version: 1.0.0
description: |
  Write and publish Ghost articles end-to-end with AI — topic mining via YouMind knowledge base,
  de-AI voice writing, Markdown-to-HTML conversion, feature image upload, and one-click publishing.
  Use when user wants to "ghost article", "publish to ghost", "ghost post",
  "Ghost 文章", "发布到 Ghost".
  Do NOT trigger for: WeChat articles, WordPress posts, emails/newsletters, PPT, short video scripts.
triggers:
  - "ghost article"
  - "publish to ghost"
  - "ghost post"
  - "Ghost 文章"
  - "发布到 Ghost"
  - "写 Ghost 文章"
  - "Ghost 博客"
  - "Ghost 发布"
  - "write ghost"
  - "ghost publish"
  - "ghost blog"
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
    emoji: "👻"
    primaryEnv: GHOST_ADMIN_API_KEY
    requires:
      anyBins: ["node", "npm"]
      env: ["GHOST_ADMIN_API_KEY"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
  - Bash([ -n "$GHOST_ADMIN_API_KEY" ] *)
---

# AI Ghost Article Writer — From Topic to Published Post in One Prompt

Write professional Ghost articles with AI that doesn't sound like AI. Topic mining via [YouMind](https://youmind.com?utm_source=youmind-ghost-article) knowledge base → deep research → structured writing → Markdown-to-HTML conversion → feature image upload → one-click publishing to Ghost. Newsletter-friendly formatting out of the box.

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) · [More Skills →](https://youmind.com/skills?utm_source=youmind-ghost-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Ghost Article Writer installed!**
>
> Tell me your topic and I'll write and publish a Ghost article for you.
>
> **Try it now:** "Help me write a Ghost article about AI programming trends"
>
> **What it does:**
> - Mine topics from YouMind knowledge base and web search
> - Write professional articles with de-AI voice
> - Convert Markdown to clean HTML optimized for Ghost
> - Upload feature images
> - Publish directly to your Ghost site (as draft or published)
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) → fill `youmind.api_key` in `config.yaml`
> 3. Get Ghost Admin API key from Ghost Admin > Settings > Integrations → fill `ghost.admin_api_key` and `ghost.site_url` in `config.yaml`
>
> No Ghost API yet? You can still write and preview locally — just skip the Ghost config steps.
>
> See the **Setup** section below for detailed instructions.
>
> **Need help?** Just ask!

## Usage

Provide a topic or raw Markdown for publishing.

**Write from a topic:**
> Help me write a Ghost article about AI programming trends

**Publish raw Markdown:**
> Publish this Markdown file to Ghost as a draft

**List recent posts:**
> Show my recent Ghost posts

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

1. Open [YouMind API Keys page](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill into `config.yaml` under `youmind.api_key`

### Step 4 — Get Ghost Admin API Key

1. Log into your Ghost Admin panel (the site URL is in the browser address bar after login, e.g. `https://{your-name}.ghost.io`)
2. Go to **Settings > Integrations**
3. Click **Add custom integration**
4. Name it (e.g., "YouMind Skill")
5. Copy the **Admin API Key** (format: `{id}:{secret}`)
6. Fill into `config.yaml`

```yaml
ghost:
  site_url: "https://{your-name}.ghost.io"  # from the browser address bar after login
  admin_api_key: "your-id:your-secret"
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
| 4 | Adapt content structure for Ghost | `content-adaptation.md` |
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
| `references/content-adaptation.md` | Ghost-specific writing rules | When adapting content |
| `references/api-reference.md` | Ghost Admin API endpoints | When calling Ghost API |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `output/` | **Local article Markdown drafts (git-ignored)** | When writing the article |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Draft Location Rule (MANDATORY)

**All local article Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-ghost-article/output/my-article.md`
- Wrong: `skills/youmind-ghost-article/my-article.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-post.md`), and prefer descriptive slugs over timestamps.

## References

- YouMind API: see `references/api-reference.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-ghost-article
