---
name: youmind-x-article
version: 1.0.0
description: |
  Write and publish tweets and threads to X (Twitter) with AI — topic research via YouMind knowledge base,
  280-char optimized writing, thread splitting, media uploads, and one-click publishing.
  Use when user wants to "tweet", "post on X", "write a thread", "publish to Twitter".
triggers:
  - "tweet"
  - "x post"
  - "twitter post"
  - "publish to x"
  - "post on x"
  - "write thread"
  - "tweet thread"
  - "x thread"
  - "twitter thread"
  - "推特"
  - "发推"
  - "推特帖子"
  - "写推文"
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
    emoji: "𝕏"
    primaryEnv: X_ACCESS_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["X_ACCESS_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI X (Twitter) Post Writer

Write viral tweets and engaging threads with AI. Topic research via [YouMind](https://youmind.com?utm_source=youmind-x-article) knowledge base, 280-character optimized writing, intelligent thread splitting, and one-click publishing to X.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-x-article) | [X Developer Portal](https://developer.x.com/) | [More Skills](https://youmind.com/skills?utm_source=youmind-x-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI X Post Writer installed!**
>
> Tell me your topic and I'll write and publish a tweet or thread for you.
>
> **Try it now:** "Write a tweet about the future of open source AI"
>
> **What it does:**
> - Research topics from your YouMind knowledge base and web trends
> - Write tweets optimized for engagement within 280 characters
> - Split long-form content into threads with proper numbering
> - Upload images and media
> - Publish directly to your X account
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-x-article) and fill `youmind.api_key` in `config.yaml`
> 3. Get X API credentials from [X Developer Portal](https://developer.x.com/) and fill the `x` section in `config.yaml`
>
> **Need help?** Just ask!

## Usage

Provide a topic, talking points, or raw text for publishing.

**Write a single tweet:**
> Write a tweet about the latest AI breakthrough

**Write a thread:**
> Write a thread explaining how transformers work, aimed at beginners

**Publish raw text:**
> Tweet this: "Just shipped our new feature! Here's what we learned..."

**Quote tweet:**
> Write a quote tweet responding to [tweet URL]

## Setup

> Prerequisites: Node.js >= 18, an X developer account with API access.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 -- Get YouMind API Key (Recommended)

1. Open [YouMind API Keys page](https://youmind.com/settings/api-keys?utm_source=youmind-x-article)
2. Create a new API key
3. Fill `youmind.api_key` in `config.yaml`

### Step 4 -- Get X API Credentials

**Option A: OAuth 2.0 (Recommended)**
1. Go to [X Developer Portal](https://developer.x.com/)
2. Create a project and app
3. Enable OAuth 2.0 with `tweet.read`, `tweet.write`, `users.read` scopes
4. Generate a user access token
5. Fill `x.access_token` in `config.yaml`

**Option B: OAuth 1.0a (Legacy)**
1. From the developer portal, get Consumer Keys and Access Token
2. Fill all four fields: `x.api_key`, `x.api_secret`, `x.access_token_legacy`, `x.access_token_secret`

### Verify Setup

After configuration, say:

> "Write a tweet about coding productivity tips"

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution | When running the publishing pipeline |
| `references/content-adaptation.md` | X content formatting rules | When adapting content |
| `references/api-reference.md` | X API endpoint details | When debugging API calls |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `output/` | **Local tweet/thread Markdown drafts (git-ignored)** | When writing the tweet/thread |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Draft Location Rule (MANDATORY)

**All local tweet and thread Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-x-article/output/my-thread.md`
- Wrong: `skills/youmind-x-article/my-thread.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-thread.md`), and prefer descriptive slugs over timestamps.

## Pipeline Overview

| Step | Action |
|------|--------|
| 1 | Load config and validate credentials |
| 2 | Research topic via YouMind knowledge base |
| 3 | Write tweet/thread with engagement optimization |
| 4 | Adapt content: 280 char limit, thread splitting, hashtags |
| 5 | Upload media if provided |
| 6 | Publish to X (single tweet or threaded reply chain) |
| 7 | Archive to YouMind (optional) |
| 8 | Report results: tweet URL, thread summary |

## Content Rules

### Single Tweet
1. **280 character limit** -- hard limit, no exceptions
2. **URLs count as 23 characters** -- regardless of actual length
3. **1-2 hashtags max** -- more looks spammy on X
4. **Strong hook** -- first words determine if people read further
5. **Clear opinion or insight** -- vague tweets get ignored

### Thread
1. **First tweet = hook** -- must stand alone and compel reading
2. **Each tweet makes sense alone** -- readers may see any tweet individually
3. **Numbered format** -- 1/N style for clarity
4. **Last tweet = CTA/summary** -- recap and call to action
5. **280 chars per tweet** -- including numbering
6. **Natural paragraph boundaries** -- split at logical breaks

### Long-form Articles (X Premium)
- Up to 25,000 characters
- Full Markdown support
- Cover image supported

## References

- X API: see `references/api-reference.md`
- Content rules: see `references/content-adaptation.md`
- Pipeline: see `references/pipeline.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-x-article
