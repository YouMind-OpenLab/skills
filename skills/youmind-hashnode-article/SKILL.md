---
name: youmind-hashnode-article
version: 2.0.0
description: |
  Write and publish Hashnode articles through YouMind OpenAPI. Supports draft-first
  publishing, published post listing, draft listing, tag lookup, and clear connector / pricing
  guidance when the user's Hashnode account is not ready inside YouMind.
triggers:
  - "hashnode article"
  - "publish to hashnode"
  - "post on hashnode"
  - "write for hashnode"
  - "hashnode post"
  - "hashnode blog"
  - "Hashnode 文章"
  - "发布到 Hashnode"
platforms:
  - codex
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Hashnode Article Writer

Write Hashnode articles with AI, then publish them through YouMind OpenAPI.

The local skill only requires a YouMind API key. The user's Hashnode token and publication are configured in YouMind, not in the local skill config.

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message immediately. Translate to the user's language.**

> **AI Hashnode Article Writer installed!**
>
> Tell me your topic and I'll help write and publish it to Hashnode.
>
> **Try it now:** "Write a Hashnode article about building APIs with GraphQL"
>
> **What it does:**
> - Research topics from your YouMind knowledge base and the web
> - Write Hashnode-friendly technical articles with subtitle and SEO metadata
> - Create Hashnode drafts by default
> - Publish existing drafts when you're ready
> - Show clear setup help if your Hashnode account is not yet connected in YouMind
>
> **One-time setup:**
> 1. Install & build: `cd toolkit && npm install && npm run build && cd ..`
> 2. Copy config: `cp config.example.yaml config.yaml`
> 3. Fill `youmind.api_key` in `config.yaml`
> 4. In YouMind, connect Hashnode at `https://youmind.com/settings/connector`
>
> **Requirements:**
> - YouMind paid plan for article dispatch OpenAPI
> - Hashnode connected in YouMind

## Local Config

`config.yaml` only needs:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

All commands read `youmind.api_key` and `youmind.base_url` from local `config.yaml`.
Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change only your local `config.yaml`.

Do not ask the user to fill local `hashnode.token` or `hashnode.publication_id`. That flow is obsolete.

## Draft Output Rule

All locally generated article files must go under `output/`.

- Correct: `skills/youmind-hashnode-article/output/my-post.hashnode.md`
- Wrong: `skills/youmind-hashnode-article/article.hashnode.md`
- Wrong: any generated article directly in the skill root

`output/` is git-ignored.

## Directory Guide

Read files on demand.

| Path | Purpose |
|------|---------|
| `toolkit/src/cli.ts` | Real CLI used for validate / publish / list flows |
| `toolkit/src/hashnode-api.ts` | YouMind OpenAPI client for Hashnode |
| `toolkit/src/publisher.ts` | High-level publish wrapper |
| `toolkit/src/content-adapter.ts` | Hashnode title / subtitle / tag / SEO adaptation |
| `references/pipeline.md` | Step-by-step execution flow |
| `references/api-reference.md` | Hashnode and YouMind OpenAPI contract summary |
| `output/` | Local adapted markdown output |

## CLI Commands

Run from `toolkit/`.

```bash
node dist/cli.js validate
node dist/cli.js publish ../article.md --draft
node dist/cli.js publish ../article.md --publish
node dist/cli.js list --page 1 --limit 10
node dist/cli.js list-drafts --page 1 --limit 10
node dist/cli.js list-published --page 1 --limit 10
node dist/cli.js publish-draft <draft_id>
node dist/cli.js get-draft <draft_id>
node dist/cli.js get-post <post_id>
node dist/cli.js preview ../article.md
node dist/cli.js search-tags typescript
```

## Behavior Rules

1. Default to draft creation unless the user explicitly asks to publish immediately.
2. If Hashnode is not connected in YouMind, surface the connector URL: `https://youmind.com/settings/connector`
3. If the paid plan check fails, surface the pricing URL: `https://youmind.com/pricing`
4. Do not fall back to asking the user for local Hashnode tokens.
5. Keep tag guidance realistic: Hashnode tag lookup is exact or slug-like, not true fuzzy search.

## Publishing Flow

1. Load `youmind.api_key`
2. If the user supplied a topic, research and draft content
3. Adapt content with `content-adapter.ts`
4. Use `publish --draft` by default
5. If the user wants immediate publication, use `publish --publish`
6. Report draft vs published state clearly
7. For drafts, show the Hashnode dashboard URL when available

## Failure Handling

- Missing YouMind API key: tell the user to set `youmind.api_key`
- Hashnode not connected in YouMind: tell the user to open `https://youmind.com/settings/connector`
- Paid plan required: tell the user to open `https://youmind.com/pricing`
- Publish failure: keep the adapted markdown in `output/` and report the backend error cleanly
