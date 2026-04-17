---
name: youmind-kit-article
version: 1.0.0
description: |
  Write and publish Kit broadcasts with AI — topic research via YouMind knowledge base,
  newsletter-feed writing, Markdown-to-HTML conversion, and publishing through the Kit
  account already connected in YouMind.
triggers:
  - "kit article"
  - "publish to kit"
  - "kit broadcast"
  - "convertkit article"
  - "写 kit 文章"
  - "发布到 kit"
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
metadata:
  openclaw:
    emoji: "✉️"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Kit Article Writer

Write Kit-native broadcasts with AI. This skill uses the user's YouMind API key locally and relies on the Kit connector already stored in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-kit-article)

## Onboarding

**MANDATORY after install: show this in the user's language**

> **AI Kit Article Writer installed!**
>
> Tell me your topic and I can draft, preview, and publish a Kit broadcast for you.
>
> **Try it now:** "Write a Kit post about what changed in our AI workflow this week"
>
> **One-time setup**
> 1. `cd toolkit && npm install && npm run build && cd ..`
> 2. Put `youmind.api_key` in `~/.youmind/config.yaml`
> 3. Connect Kit in YouMind Connector Settings
>
> Default behavior is web-public publishing. If the user wants a hidden draft, use the private mode.
> Private drafts can be checked in the Kit campaigns view: `https://app.kit.com/campaigns`.
> Also make sure the sender email is already confirmed inside Kit, otherwise createBroadcast will be rejected.

## Usage

- Draft from a topic: `Write a Kit broadcast about AI release notes`
- Publish existing Markdown: `Publish this markdown to Kit`
- Validate setup: `Validate my Kit setup`
- Inspect templates: `List my Kit email templates`
- List recent broadcasts: `List my Kit broadcasts`

## Setup

```bash
cd toolkit && npm install && npm run build && cd ..
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

Shared credentials live in `~/.youmind/config.yaml`. Optional skill override: `~/.youmind/config/youmind-kit-article.yaml`.

## Skill Directory

| Path | Purpose |
|------|---------|
| `references/pipeline.md` | Execution sequence |
| `references/platform-dna.md` | Kit audience and format rules |
| `references/content-generation-playbook.md` | Topic -> Kit draft |
| `references/content-adaptation-playbook.md` | Existing article -> Kit broadcast |
| `references/api-reference.md` | YouMind Kit OpenAPI usage |
| `toolkit/src/*.ts` | CLI and publisher implementation |

## Rules

1. Optimize for newsletter feed readability, not generic blogging.
2. Use HTML output for publishing.
3. Default to public web posting unless the user explicitly wants private mode.
4. Keep subject line, preview text, and first paragraph tightly aligned.
5. End publish actions with the Kit public URL when available.
6. If the broadcast is private, tell the user to inspect it in `https://app.kit.com/campaigns`.
