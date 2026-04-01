---
name: youmind-reddit-article
version: 1.0.0
description: |
  Write and publish Reddit posts with AI — topic research via YouMind knowledge base,
  subreddit-aware content adaptation, Reddit-flavored Markdown, flair selection, and one-click submission.
  Use when user wants to "post on Reddit", "submit to Reddit", "write a Reddit post".
triggers:
  - "reddit post"
  - "publish to reddit"
  - "reddit article"
  - "submit to reddit"
  - "post on reddit"
  - "write for reddit"
  - "Reddit 帖子"
  - "发布到 Reddit"
  - "写 Reddit"
  - "Reddit 文章"
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
    emoji: "🤖"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Reddit Post Writer

Write engaging Reddit posts with AI that fit the culture of each subreddit. Topic research via [YouMind](https://youmind.com?utm_source=youmind-reddit-article) knowledge base, subreddit-aware content adaptation, Reddit-flavored Markdown, flair selection hints, and one-click submission.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-reddit-article) | [Reddit API Setup](https://www.reddit.com/prefs/apps) | [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy) | [More Skills](https://youmind.com/skills?utm_source=youmind-reddit-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Reddit Post Writer installed!**
>
> Tell me your topic and target subreddit, and I'll write and submit a post for you.
>
> **Try it now:** "Write a Reddit post for r/programming about building CLI tools with TypeScript"
>
> **What it does:**
> - Research topics from your YouMind knowledge base and web
> - Write posts adapted to the target subreddit's tone and rules
> - Format with Reddit-flavored Markdown
> - Check subreddit rules and suggest appropriate flair
> - Submit directly to Reddit (self-post or link post)
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-reddit-article) and fill `youmind.api_key` in `config.yaml`
> 3. Fill your Reddit `username` and `password` in `config.yaml` (that's it! No API approval needed)
>
> **Need help?** Just ask!

## Usage

Provide a topic, target subreddit, and optionally a link.

**Write a self-post:**
> Write a Reddit post for r/learnprogramming about getting started with Rust

**Submit a link post:**
> Submit this article to r/technology: https://example.com/ai-news

**Write with specific flair:**
> Post to r/Python with "Discussion" flair about async patterns

## Setup

> Prerequisites: Node.js >= 18, a Reddit account.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 -- Get YouMind API Key (Recommended)

1. Open [YouMind API Keys page](https://youmind.com/settings/api-keys?utm_source=youmind-reddit-article)
2. Create a new API key
3. Fill `youmind.api_key` in `config.yaml`

### Step 4 -- Fill in Reddit Credentials

Fill your Reddit username and password in `config.yaml`. Leave `client_id` and `client_secret` empty to use **cookie mode** (no API approval needed):

```yaml
reddit:
  client_id: ""
  client_secret: ""
  username: "your_reddit_username"
  password: "your_reddit_password"
  user_agent: "youmind-reddit/1.0 by /u/your_username"
```

> **Optional:** If you have Reddit API credentials (from before Nov 2025 or approved via [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)), fill in `client_id` and `client_secret` to use OAuth mode for a more stable experience.

### Verify Setup

After configuration, say:

> "Write a Reddit post for r/test about testing my new skill"

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution | When running the publishing pipeline |
| `references/content-adaptation.md` | Reddit content formatting rules | When adapting content |
| `references/api-reference.md` | Reddit API endpoint details | When debugging API calls |
| `config.yaml` | API credentials | Step 1 (first-run check) |
| `toolkit/dist/*.js` | Executable scripts | Various steps |

## Pipeline Overview

| Step | Action |
|------|--------|
| 1 | Load config and validate credentials |
| 2 | Research topic via YouMind knowledge base |
| 3 | Fetch subreddit rules and available flairs |
| 4 | Write post with subreddit-appropriate tone |
| 5 | Adapt content: Reddit Markdown, TL;DR, discussion prompt |
| 6 | Submit to Reddit (self-post or link) |
| 7 | Archive to YouMind (optional) |
| 8 | Report results: post URL, flair, warnings |

## Content Rules

1. **Reddit-flavored Markdown** -- use standard Markdown, Reddit supports it natively
2. **Descriptive title, NO clickbait** -- Reddit users despise clickbait
3. **TL;DR** -- add at top or bottom for long posts
4. **Match subreddit tone** -- r/science is formal, r/gaming is casual
5. **Flair selection** -- choose appropriate flair based on content type
6. **End with a question** -- drives discussion and comments
7. **Max 40,000 characters** -- Reddit's limit for self-posts
8. **Respect subreddit rules** -- check rules before posting
9. **No self-promotion spam** -- Reddit's site-wide rule
10. **Add value first** -- helpful content, not marketing

## References

- Reddit API: see `references/api-reference.md`
- Content rules: see `references/content-adaptation.md`
- Pipeline: see `references/pipeline.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-reddit-article
