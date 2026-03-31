---
name: youmind-linkedin-article
description: |
  Write and publish LinkedIn posts and articles end-to-end with AI — trending topic analysis,
  thought leadership voice, hashtag strategy, cover image generation, and direct publishing.
  Dual mode: short-form Posts (≤3000 chars) and long-form Articles (unlimited).
  Integrates YouMind knowledge base and supports multiple image AI providers.
  Use when user wants to "write a LinkedIn post", "LinkedIn article", "LinkedIn 文章",
  "发 LinkedIn", "thought leadership piece", "publish to LinkedIn".
  Do NOT trigger for: WeChat articles, Reddit posts, generic blog posts, emails.
triggers:
  - "LinkedIn"
  - "linkedin"
  - "LinkedIn post"
  - "LinkedIn article"
  - "LinkedIn 文章"
  - "LinkedIn 帖子"
  - "发 LinkedIn"
  - "写 LinkedIn"
  - "publish to LinkedIn"
  - "thought leadership"
  - "LinkedIn 推文"
  - "LinkedIn content"
  - "professional post"
platforms:
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
  primaryEnv: YOUMIND_API_KEY
  requires:
    anyBins: ["node", "npm"]
    env: []
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(python3 scripts/*)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI LinkedIn Writer — From Idea to Published Post in One Prompt

Write LinkedIn posts and articles with AI that sound like a thought leader, not a chatbot.
Dual mode: concise Posts for daily engagement + in-depth Articles for authority building.
Topic mining → YouMind research → professional voice writing → hashtag strategy → image generation → direct publishing.

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-linkedin-article)

## Onboarding

**⚠️ MANDATORY: Show this immediately on first install:**

> **✅ AI LinkedIn Writer installed!**
>
> Tell me your topic and I'll write and publish a LinkedIn post or article.
>
> **Try it:** "Write a LinkedIn post about the future of AI agents"
>
> **What it does:**
> - Auto-detect: short content → Post, long content → Article
> - Write with professional thought leadership voice
> - Smart hashtag strategy for discovery
> - Generate cover images with AI (4 providers)
> - Publish directly to your LinkedIn feed
>
> **Setup (one-time):**
> 1. `cd toolkit && npm install && npm run build`
> 2. `cp config.example.yaml config.yaml`
> 3. Create LinkedIn app at https://www.linkedin.com/developers/apps
> 4. Obtain OAuth access token with `w_member_social` scope
> 5. Fill `linkedin.access_token` and `linkedin.person_urn` in config.yaml
> 6. Optional: Add YouMind API key for knowledge mining

## Usage

**Write a post (short-form):**
> Write a LinkedIn post about why most AI tools fail at production deployment

**Write an article (long-form):**
> Write a LinkedIn article analyzing the AI agent landscape in 2026

**Specify language:**
> 帮我写一篇中文的 LinkedIn 文章，关于创业公司如何利用 AI 提效

**Interactive mode:**
> Write LinkedIn content interactively — let me choose post vs article and topic

## Setup

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build
```

### Step 2 — Create Config

```bash
cp config.example.yaml config.yaml
```

### Step 3 — LinkedIn API Credentials

1. Go to https://www.linkedin.com/developers/apps and create an app
2. Request `w_member_social` permission (may require app review)
3. Generate an OAuth access token
4. Find your person URN: call `GET /v2/me` with the token
5. Fill in config.yaml:

```yaml
linkedin:
  access_token: "your_access_token"
  person_urn: "urn:li:person:XXXXXXXXX"
```

> **Note:** LinkedIn access tokens expire. You'll need to refresh periodically.

### Step 4 — YouMind API Key (Optional)

For knowledge mining and AI image generation, add your YouMind API key.

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full 8-step execution pipeline | When running the writing pipeline |
| `references/writing-guide.md` | LinkedIn writing style (thought leadership) | Step 4 (writing) |
| `references/hashtag-strategy.md` | Hashtag selection and placement | Step 5 (optimization) |
| `references/linkedin-constraints.md` | Platform limits (Post 3000 chars, etc.) | When debugging issues |
| `references/seo-rules.md` | LinkedIn algorithm optimization | Step 5 (optimization) |
| `references/frameworks.md` | Post vs Article decision + frameworks | Step 3.5 (framework) |
| `references/visual-prompts.md` | Image/carousel design | Step 6 (visuals) |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Execution Modes

**Auto (default):** Auto-detect Post vs Article based on content length. Run all steps.

**Interactive:** Pause at: Post/Article decision, topic selection, framework choice, hashtag review.

## Content Type Decision

| Signal | → Post | → Article |
|--------|--------|-----------|
| Content ≤1500 chars | ✅ | |
| Content >1500 chars | | ✅ |
| User says "post" | ✅ | |
| User says "article" | | ✅ |
| Quick insight/opinion | ✅ | |
| In-depth analysis | | ✅ |
| Daily engagement | ✅ | |
| Authority building | | ✅ |

## Critical Quality Rules

1. **Read `references/writing-guide.md` BEFORE writing.**
2. **Hook line is everything.** First 2 lines must stop the scroll. LinkedIn truncates after ~210 chars.
3. **Post ≤3000 chars.** LinkedIn hard limit. Optimal: 1200-1500 chars.
4. **Data-driven claims.** Every opinion needs a supporting fact, stat, or example.
5. **Personal angle required.** "I learned...", "In my experience...", "Here's what most people miss..."
6. **3-5 hashtags max.** More looks spammy. Mix broad + niche.
7. **No AI-sounding text.** LinkedIn users are particularly sensitive to generic AI content.
8. **Always publish.** Step 7 publishes directly. Do NOT ask — this is automatic.

## Pipeline Overview

Read `references/pipeline.md` for full details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load client config + routing | — |
| 1.5 | Decide Post vs Article + mine YouMind | `frameworks.md` |
| 2 | Analyze LinkedIn trending topics | — |
| 2.5 | Dedup against history | — |
| 3 | Generate 10 topics, score, select best | — |
| 3.5 | Select content framework | `frameworks.md` |
| 4 | Write with thought leadership voice | `writing-guide.md` |
| 5 | Hashtag strategy + algorithm optimization | `hashtag-strategy.md`, `seo-rules.md` |
| 6 | Generate images if applicable | `visual-prompts.md` |
| 7 | **Publish to LinkedIn** (mandatory) | — |
| 7.5 | Append to history + archive | — |
| 8 | Report results | — |

## Resilience

| Step | Fallback |
|------|----------|
| 2 Trending | YouMind web-search → ask user |
| 6 Image gen | Output prompts, skip images |
| 7 Publish | Save as local HTML/text preview |
