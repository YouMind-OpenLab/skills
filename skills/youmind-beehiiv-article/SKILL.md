---
name: youmind-beehiiv-article
version: 1.0.0
description: |
  Write and publish Beehiiv posts with AI — topic research via YouMind knowledge base,
  newsletter-style writing, Markdown-to-HTML conversion, and publishing through the Beehiiv
  account already connected in YouMind.
triggers:
  - "beehiiv article"
  - "publish to beehiiv"
  - "beehiiv post"
  - "beehiiv newsletter"
  - "写 beehiiv 文章"
  - "发布到 beehiiv"
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
metadata:
  openclaw:
    emoji: "🐝"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Beehiiv Article Writer

Write Beehiiv-native posts with AI. This skill uses the user's YouMind API key locally and relies on the Beehiiv connector already stored in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-beehiiv-article)

## Onboarding

**MANDATORY after install: show this in the user's language**

> **AI Beehiiv Article Writer installed!**
>
> Tell me your topic and I can draft, preview, and publish a Beehiiv post for you.
>
> **Try it now:** "Write a Beehiiv post about how AI coding agents changed weekly product updates"
>
> **One-time setup**
> 1. `cd toolkit && npm install && npm run build && cd ..`
> 2. Put `youmind.api_key` in `~/.youmind/config.yaml`
> 3. Connect Beehiiv in YouMind Connector Settings
>
> **Important:** Beehiiv post creation can return `403` if the target publication does not have Send API access enabled on Beehiiv's side.

## Usage

- Draft a post from a topic: `Write a Beehiiv post about AI product ops`
- Publish existing Markdown: `Publish this markdown to Beehiiv as a draft`
- Validate setup: `Validate my Beehiiv setup`
- List recent posts: `List my Beehiiv posts`

## Setup

```bash
cd toolkit && npm install && npm run build && cd ..
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

Shared credentials live in `~/.youmind/config.yaml`. Optional skill override: `~/.youmind/config/youmind-beehiiv-article.yaml`.

## Skill Directory

| Path | Purpose |
|------|---------|
| `references/pipeline.md` | Execution sequence |
| `references/platform-dna.md` | Beehiiv audience and format rules |
| `references/content-generation-playbook.md` | Topic -> Beehiiv draft |
| `references/content-adaptation-playbook.md` | Existing article -> Beehiiv post |
| `references/api-reference.md` | YouMind Beehiiv OpenAPI usage |
| `toolkit/src/*.ts` | CLI and publisher implementation |

## Rules

1. Default to draft unless the user explicitly asks to publish immediately.
2. Optimize for newsletter readability: strong headline, short intro, tight sections.
3. Use HTML output for publishing; keep markup simple and email-safe.
4. Surface the Beehiiv Send API caveat before publish if the user expects a guaranteed live push.
5. End publish actions with the Beehiiv web URL when available.
