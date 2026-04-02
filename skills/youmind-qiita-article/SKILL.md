---
name: youmind-qiita-article
version: 1.0.0
description: |
  Write and publish Qiita articles with AI — topic research via YouMind knowledge base,
  Japanese developer-audience adapted writing, GFM Markdown with Qiita extensions, and one-click publishing.
  Use when user wants to "write Qiita article", "publish to Qiita", "post on Qiita", "Qiita に記事を投稿".
triggers:
  - "qiita article"
  - "publish to qiita"
  - "post on qiita"
  - "write for qiita"
  - "qiita post"
  - "Qiita 記事"
  - "Qiita に投稿"
  - "Qiita に記事を投稿"
  - "Qiita 文章"
  - "发布到 Qiita"
  - "写 Qiita 文章"
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
    emoji: "📝"
    primaryEnv: QIITA_ACCESS_TOKEN
    requires:
      anyBins: ["node", "npm"]
      env: ["QIITA_ACCESS_TOKEN"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Qiita Article Writer

Write technical Qiita articles with AI that resonate with the Japanese developer community. Topic research via [YouMind](https://youmind.com?utm_source=youmind-qiita-article) knowledge base, developer-audience adapted writing, GFM Markdown with Qiita extensions, and one-click publishing to Qiita.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article) | [Get Qiita Access Token](https://qiita.com/settings/applications) | [More Skills](https://youmind.com/skills?utm_source=youmind-qiita-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Qiita Article Writer installed!**
>
> Tell me your topic and I'll write and publish a Qiita article for you.
>
> **Try it now:** "Write a Qiita article about building CLI tools with TypeScript"
>
> **What it does:**
> - Research topics from trending developer discussions and your YouMind knowledge base
> - Write technical articles adapted for Qiita's developer community
> - Format with GFM Markdown and Qiita extensions (note boxes, math, Mermaid diagrams)
> - Validate content for Qiita best practices
> - Publish directly to Qiita (as private or public)
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article) and fill `youmind.api_key` in `config.yaml`
> 3. Get [Qiita Access Token](https://qiita.com/settings/applications) (with `write_qiita` scope) and fill `qiita.access_token` in `config.yaml`
>
> No Qiita token yet? You can still write and preview locally — just skip the Qiita config step.
>
> **Need help?** Just ask!

## Usage

Provide a topic, a raw Markdown file, or describe the article you want.

**Write from a topic:**
> Write a Qiita article about building REST APIs with Hono and Bun

**Write with specific tags:**
> Write a Qiita post about React Server Components, tag it with React, TypeScript, フロントエンド

**Publish existing Markdown:**
> Publish this markdown to Qiita as private

**Validate before publishing:**
> Validate my article for Qiita best practices

## Setup

> Prerequisites: Node.js >= 18, a Qiita account.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 -- Get YouMind API Key (Recommended)

YouMind API Key enables knowledge base search, web search, and article archiving.

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`

### Step 4 -- Get Qiita Access Token

1. Go to [Qiita Settings > Applications](https://qiita.com/settings/applications)
2. Under **Personal Access Tokens**, click **Generate new token**
3. Select the `write_qiita` scope (required for creating/updating articles)
4. Copy the token and fill in `config.yaml` under `qiita.access_token`

### Verify Setup

After configuration, try:

> "Write a Qiita article about TypeScript best practices"

If something is misconfigured, the skill will report what needs fixing at the relevant step.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution (Steps 1-7) | When running the writing pipeline |
| `references/content-adaptation.md` | Qiita writing rules, structure, tone | Step 4 (content adaptation) |
| `references/api-reference.md` | Qiita API v2 endpoint documentation | When calling Qiita API |
| `config.yaml` | API credentials (Qiita, YouMind) | Step 1 (config load) |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details of each step.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate access token | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic: web search, existing Qiita coverage | -- |
| 4 | Content adaptation: structure for Qiita audience | `content-adaptation.md` |
| 5 | Write article with code examples, environment info, proper structure | -- |
| 6 | Publish to Qiita (private or public) | `api-reference.md` |
| 7 | Report results: title, URL, tags, published status | -- |

**Routing shortcuts:**

- User gave a specific topic -> Skip broad research, go to Step 4
- User gave raw Markdown -> Skip to Step 6 (publish)

---

## Critical Quality Rules

Non-negotiable for every Qiita article:

1. **Environment info.** Always include versions, OS, tools used.
2. **Code blocks must have language tags.** Never use bare triple backticks.
3. **Clear structure.** Introduction → Prerequisites → Main content → Code → Results → Gotchas → References.
4. **Title: specific and descriptive.** Technology name first, then what the reader learns.
5. **At least 1 tag, max 5.** Use existing popular tags for discoverability.
6. **No marketing language.** Pure technical content. Write like sharing knowledge with peers.
7. **Every code example must be complete and testable.** Include imports, setup, and expected output.
8. **Match the user's language.** If user writes in Japanese, article should be in Japanese. If English, use English.
9. **Private by default.** Unless user explicitly requests public publishing.
10. **No clickbait.** Specific, honest titles that describe what the reader will learn.

---

## Resilience: Never Stop on a Single-Step Failure

Every step has a fallback. If a step AND its fallback both fail, skip and note it in the final output.

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty knowledge_context |
| 3 Research | YouMind web-search -> ask user |
| 5 Writing | Ask user for manual content |
| 6 Publishing | Save markdown locally |
| 7 Report | Print what was completed |

---

## Gotchas -- Common Failure Patterns

**"The Untested Code":** Posting code that doesn't actually run. Qiita readers will call this out in comments immediately.

**"The Missing Environment":** Not specifying Node.js version, OS, or library versions. Readers can't reproduce the setup.

**"The Copy-Paste from Docs":** Rewriting official documentation without adding personal insights or real-world experience.

**"The Wrong Language":** Writing in English when the user and audience expect Japanese, or vice versa.

**"The Tag Mismatch":** Using tags that don't match the content. Hurts discoverability and credibility.

## References

- Qiita API v2: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-qiita-article
