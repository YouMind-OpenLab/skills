---
name: youmind-reddit-article
description: |
  Write and publish Reddit posts end-to-end with AI — trending topic mining from subreddits,
  community-native voice writing, cover image generation, and one-click post submission.
  Integrates YouMind knowledge base for source material and supports multiple image AI providers.
  Use when user wants to "write a Reddit post", "发 Reddit 帖子", "post to Reddit",
  "submit to subreddit", "Reddit 文章".
  Do NOT trigger for: WeChat articles, LinkedIn posts, generic blog posts, emails.
triggers:
  - "Reddit"
  - "reddit"
  - "subreddit"
  - "Reddit post"
  - "Reddit article"
  - "Reddit 帖子"
  - "Reddit 文章"
  - "发 Reddit"
  - "写 Reddit"
  - "submit to Reddit"
  - "post to Reddit"
  - "crosspost"
  - "r/"
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

# AI Reddit Article Writer — From Topic to Post in One Prompt

Write Reddit posts with AI that sound like a real community member, not a marketer.
Trending topic mining → deep research via YouMind knowledge base → community-native writing → image generation → one-click post submission to any subreddit.

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-reddit-article)

## Onboarding

**⚠️ MANDATORY: Show this immediately on first install:**

> **✅ AI Reddit Writer installed!**
>
> Tell me a topic and target subreddit, I'll write and post for you.
>
> **Try it:** "Help me write a post about AI coding tools for r/programming"
>
> **What it does:**
> - Mine trending topics from target subreddits
> - Write community-native posts (no marketing speak)
> - Generate cover/inline images with AI
> - Submit directly to subreddit with flair support
> - Crosspost to related subreddits
>
> **Setup (one-time):**
> 1. `cd toolkit && npm install && npm run build`
> 2. `cp config.example.yaml config.yaml`
> 3. Create a Reddit app at https://www.reddit.com/prefs/apps (script type)
> 4. Fill `reddit.client_id`, `reddit.client_secret`, `reddit.username`, `reddit.password` in config.yaml
> 5. Optional: Add YouMind API key for knowledge mining and AI image generation

## Usage

**Write for a specific subreddit:**
> Write a post about Rust async patterns for r/rust

**Write with specific topic:**
> 帮我写一篇关于 AI Agent 的 Reddit 帖子，发到 r/artificial

**Interactive mode:**
> Write a Reddit post interactively — let me pick the subreddit and topic

## Setup

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build
```

### Step 2 — Create Config

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Reddit API Credentials

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..." at the bottom
3. Select **script** type
4. Fill name and redirect URI (use `http://localhost:8080`)
5. Copy the client ID (under the app name) and secret
6. Fill in config.yaml:

```yaml
reddit:
  client_id: "your_client_id"
  client_secret: "your_client_secret"
  username: "your_reddit_username"
  password: "your_reddit_password"
```

### Step 4 — YouMind API Key (Optional)

For knowledge mining and AI image generation, add your YouMind API key.

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full 8-step execution pipeline | When running the writing pipeline |
| `references/writing-guide.md` | Reddit writing style and voice | Step 4 (writing) |
| `references/subreddit-guide.md` | Subreddit selection strategy | Step 2-3 (topic/subreddit selection) |
| `references/reddit-constraints.md` | Platform technical limits | When debugging posting issues |
| `references/seo-rules.md` | Reddit algorithm optimization | Step 5 (optimization) |
| `references/frameworks.md` | Post frameworks | Step 3.5 (framework selection) |
| `references/visual-prompts.md` | Image design for Reddit | Step 6 (visuals) |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Execution Modes

**Auto (default):** Run Steps 1–8 automatically. Pause before image generation to ask about scope.

**Interactive:** Pause at: subreddit selection, topic selection, framework choice, image plan.

## Critical Quality Rules

1. **Read `references/writing-guide.md` BEFORE writing.** Reddit voice rules are non-negotiable.
2. **Zero marketing speak.** Reddit communities detect and downvote promotional content instantly.
3. **Title: compelling but honest.** No clickbait. 100-300 chars optimal.
4. **Include TL;DR** for posts >500 words.
5. **Community-first.** Write as if you're sharing with friends, not selling to customers.
6. **Obey subreddit rules.** Check sidebar rules before posting.
7. **Always publish to the subreddit.** Do NOT ask whether to post — this is automatic.

## Pipeline Overview

Read `references/pipeline.md` for full details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load client config + routing | — |
| 1.5 | Mine YouMind knowledge base | — |
| 2 | Fetch hot posts from target subreddit | — |
| 2.5 | Dedup against history + analyze trends | — |
| 3 | Generate 10 topics, score, select best | `subreddit-guide.md` |
| 3.5 | Select post framework | `frameworks.md` |
| 4 | Write post with Reddit voice | `writing-guide.md` |
| 5 | Optimize for Reddit algorithm | `seo-rules.md` |
| 6 | Generate images if applicable | `visual-prompts.md` |
| 7 | **Submit to subreddit** (mandatory) | — |
| 7.5 | Append to history + archive | — |
| 8 | Report results | — |

## Resilience

Every step has a fallback. If a step AND its fallback both fail, skip and note it.

| Step | Fallback |
|------|----------|
| 2 Hot posts | YouMind web-search → ask user |
| 6 Image gen | Output prompts, skip images |
| 7 Post submit | Save as local Markdown + preview |
