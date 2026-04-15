---
name: youmind-x-article
version: 1.0.0
description: |
  Write and publish tweets to X (Twitter) with AI — topic research via YouMind knowledge base,
  280-char optimized writing, numbered multi-tweet sequences, and one-click publishing through
  the X account already connected in YouMind.
  Use when user wants to "tweet", "post on X", "publish to Twitter", or "write a thread".
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
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI X (Twitter) Post Writer

Write viral tweets with AI. Topic research via [YouMind](https://youmind.com?utm_source=youmind-x-article) knowledge base, 280-character optimized writing, numbered multi-tweet sequences, and one-click publishing to X through the X account already connected in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-x-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-x-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI X Post Writer installed!**
>
> Tell me your topic and I'll write and publish a tweet for you.
>
> **Try it now:** "Write a tweet about the future of open source AI"
>
> **What it does:**
> - Research topics from your YouMind knowledge base and web trends
> - Write tweets optimized for engagement within 280 characters
> - Split long content into numbered tweet sequences (1/N format)
> - Publish directly to X through the X account connected in YouMind
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-x-article) and fill `youmind.api_key` in `config.yaml`
> 3. Connect your X account inside YouMind before publishing. This skill no longer reads X developer keys locally.
> 4. Publishing requires a paid YouMind plan (Pro / Max) and consumes YouMind credits per tweet.
>
> No X connection yet, or on a free plan? You can still write and preview locally — just skip the publish step.
>
> **Need help?** Just ask!

## Usage

Provide a topic, talking points, or raw text for publishing.

**Write a single tweet:**
> Write a tweet about the latest AI breakthrough

**Write a multi-tweet sequence:**
> Write a thread explaining how transformers work, aimed at beginners

**Publish raw text:**
> Tweet this: "Just shipped our new feature! Here's what we learned..."

## Setup

> Prerequisites: Node.js >= 18, a YouMind API key, a Pro/Max YouMind plan, and an X account connected in YouMind if you want to publish.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 -- Get YouMind API Key

YouMind API Key enables knowledge base search, web search, article archiving, and X publishing.

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-x-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`
5. Keep `youmind.base_url` as `https://youmind.com/openapi/v1` in examples and documentation. Local backend testing should only override your local `config.yaml`.

### Step 4 -- Connect X in YouMind

1. Open YouMind and connect your X account via the product's publishing / connector settings flow (one-click OAuth 2.0 PKCE)
2. Save the connection once
3. Keep only `youmind.api_key` in this skill's `config.yaml`

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

Validation checks only the local API key. X connectivity and plan eligibility are validated on the first publish call:
- If the current plan is not eligible, the OpenAPI returns `402` with an upgrade link to `https://youmind.com/pricing`.
- If the X account is not connected, the OpenAPI returns `404 X_ACCOUNT_NOT_CONNECTED`. Connect the X account in the YouMind connector settings.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution | When running the publishing pipeline |
| `references/content-adaptation.md` | X content formatting rules | When adapting content |
| `references/api-reference.md` | YouMind X OpenAPI endpoint documentation | When calling X through YouMind |
| `config.yaml` | API credentials (YouMind only) | Step 1 |
| `output/` | **Local tweet Markdown drafts (git-ignored)** | When writing the tweet/sequence |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

## Draft Location Rule (MANDATORY)

**All local tweet Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-x-article/output/my-thread.md`
- Wrong: `skills/youmind-x-article/my-thread.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory
- Wrong: any path inside `references/`, `toolkit/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-thread.md`).

## Pipeline Overview

Read `references/pipeline.md` for full execution details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate the YouMind API key | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic via web search | -- |
| 4 | Adapt content: 280 char limit, split into sequence if long | `content-adaptation.md` |
| 5 | Publish to X via YouMind X OpenAPI | `api-reference.md` |
| 6 | Report results: post IDs, X URLs |  |

**Routing shortcuts:**

- User gave a short topic → Skip broad research, go to Step 4
- User gave raw tweet text → Skip to Step 5 (publish)
- User wants preview only → Run local adaptation, skip publishing

## Content Rules

### Single Tweet
1. **280 character limit** — hard limit, no exceptions
2. **URLs count as 23 characters** — regardless of actual length
3. **1-2 hashtags max** — more looks spammy on X
4. **Strong hook** — first words determine if people read further
5. **Clear opinion or insight** — vague tweets get ignored

### Thread (Tweet Chain)
1. **First tweet = hook** — must stand alone and compel reading
2. **Each tweet makes sense alone** — readers may see any tweet individually
3. **Numbered format** — `1/N` style for clarity (optional but recommended)
4. **Last tweet = CTA/summary** — recap and call to action
5. **280 chars per tweet** — including numbering
6. **Natural paragraph boundaries** — split at logical breaks

Threads publish as a native X reply-chain: the skill takes the first tweet's `postId` and passes it as `replyToPostId` for the second tweet, and so on. X renders the full sequence as a proper thread in readers' timelines.

### Images

- Images must already be hosted under `https://cdn.gooo.ai/...` (YouMind enforces this allowlist to avoid SSRF)
- Upload local files to YouMind first (e.g., via the YouMind product UI or AI image generation), then reference the returned CDN URL
- Up to 4 images per tweet; for a sequence they attach to the first tweet only

## Resilience: Never Stop on a Single-Step Failure

Every step has a fallback. If a step AND its fallback both fail, skip and note it in the final output.

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty knowledge context |
| 3 Research | Ask user for manual input |
| 5 Publishing | Save adapted text locally under `output/` for manual posting |
| -- Archive to YouMind | Warn, continue |

## References

- YouMind X OpenAPI: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-x-article
