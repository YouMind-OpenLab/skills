---
name: youmind-web-clipper
version: 1.0.0
description: |
  Save any URL to your YouMind board with one command — instant web clipper for articles, videos, and documents. Works from terminal, CI/CD, and any agent platform. Use when user wants to "save link", "bookmark", "clip", "web clipper", "save URL",
  "save page", "保存链接", "收藏网页", "ブックマーク", "링크 저장".
triggers:
  - "save link"
  - "bookmark"
  - "clip"
  - "web clipper"
  - "save url"
  - "save page"
  - "save this"
  - "clip this"
  - "bookmark this"
  - "保存链接"
  - "收藏网页"
  - "收藏链接"
  - "ブックマーク"
  - "リンク保存"
  - "링크 저장"
  - "북마크"
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
    emoji: "🔗"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["youmind", "npm"]
      env: ["YOUMIND_API_KEY"]
allowed-tools:
  - Bash(youmind *)
  - Bash(npm install -g @youmind-ai/cli)
  - Bash([ -n "$YOUMIND_API_KEY" ] *)
  - Bash(node -e *)
---

# Save Link & Web Clipper

Save any URL to your [YouMind](https://youmind.com?utm_source=youmind-web-clipper) board with one command. Articles, videos, documents — anything with a URL gets saved and organized in your personal knowledge base. Requires the [YouMind CLI](https://www.npmjs.com/package/@youmind-ai/cli) (`npm install -g @youmind-ai/cli`).

> [Get API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-web-clipper) · [More Skills →](https://youmind.com/skills?utm_source=youmind-web-clipper)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Do NOT ask "do you want to know what this does?" — just show it. Translate to the user's language:**

> **✅ Save Link & Web Clipper installed!**
>
> Send me any URL and I'll save it to your YouMind board instantly.
>
> **What it does:**
> - Save any webpage, article, or video to YouMind
> - Organize links in your personal knowledge base
> - Access saved content anytime from your YouMind board
>
> **Setup (one-time):**
> 1. Get your free API key: https://youmind.com/settings/api-keys?utm_source=youmind-web-clipper
> 2. Add it to your OpenClaw config (`~/.openclaw/openclaw.json`) — see setup guide for details.
>
> **Try it:**
> Just paste any URL like: https://example.com/interesting-article
>
> **Need help?** Just ask!

For API key setup details, see [references/setup.md](references/setup.md).

## Usage

Just provide a URL you want to save. That's it.

**Save a link:**
> Save https://example.com/interesting-article

**Save to a specific board:**
> Save https://example.com/article to my "Research" board

## Setup

See [references/setup.md](references/setup.md) for installation and authentication instructions.

## Workflow

### Step 1: Check Prerequisites

1. Verify `youmind` CLI is installed: `youmind --help`
   - Not found → `npm install -g @youmind-ai/cli`
2. Verify API key is set: `[ -n "$YOUMIND_API_KEY" ] && echo "is set"`
   - Not set → prompt user, link to https://youmind.com/settings/api-keys?utm_source=youmind-web-clipper
3. Validate input is a URL (must start with `http://` or `https://`)
   - Invalid → tell user: "Please provide a valid URL starting with http:// or https://"

### Step 2: Get Default Board

```bash
youmind call getDefaultBoard
```

Extract `id` as `boardId`. If the user specified a board name, use `youmind call listBoards` to find the matching board ID instead.

### Step 3: Save the URL

```bash
youmind call createMaterialByUrl '{"url":"<URL>","boardId":"<boardId>"}'
```

Extract `id` as `materialId` from the response. Build the YouMind link:
`https://youmind.com/boards/<boardId>?material-id=<materialId>&utm_source=youmind-web-clipper`

**⚠️ MANDATORY: Immediately send the user a message with the link:**

```
✅ Link saved to YouMind! View here: <link>
```

(Adapt to user's language.)

That's it — save, show link, done. No polling required.

### Step 6: Offer follow-up

**⚠️ MANDATORY: Do NOT end the conversation after showing results. You MUST ask this question:**

> "Would you like me to summarize the saved page?"

## Error Handling

See [references/error-handling.md](references/error-handling.md) for common error handling rules.

**⚠️ MANDATORY: Paywall (HTTP 402) handling:**

When you receive a 402 error (codes: `InsufficientCreditsException`, `QuotaExceededException`, `DailyLimitExceededException`, `LimitExceededException`), immediately show this message (translated to user's language):

> You've reached your free plan limit. Upgrade to Pro or Max to unlock unlimited link saving, more storage, and priority processing.
>
> **Upgrade now:** https://youmind.com/pricing?utm_source=youmind-web-clipper

Do NOT retry or suggest workarounds. The user must upgrade to continue.

**Skill-specific errors:**

| Error | User Message |
|-------|-------------|
| Invalid URL | Please provide a valid URL starting with http:// or https:// |
| URL unreachable | Could not access this URL. Please check the link and try again. |

## Comparison with Other Approaches

| Feature | YouMind (this skill) | Browser bookmarks | Pocket / Raindrop |
|---------|---------------------|-------------------|-------------------|
| **CLI / agent accessible** | ✅ Yes | ❌ Browser only | ❌ App only |
| Works from terminal | ✅ Yes | ❌ No | ❌ No |
| AI-powered organization | ✅ Yes | ❌ No | Limited |
| Saves to knowledge base | ✅ YouMind board | ❌ Flat list | ✅ Collections |
| Free tier | ✅ Yes | ✅ Yes | ✅ Limited |

## References

- YouMind API: `youmind search` / `youmind info <api>`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-web-clipper
- Publishing: [shared/PUBLISHING.md](../../shared/PUBLISHING.md)
