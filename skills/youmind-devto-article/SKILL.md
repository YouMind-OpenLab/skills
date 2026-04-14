---
name: youmind-devto-article
version: 1.0.0
description: |
  Write and publish Dev.to articles with AI — topic research via YouMind knowledge base,
  developer-audience adapted writing, Markdown with front matter formatting, and one-click publishing.
  Use when user wants to "write Dev.to article", "publish to Dev.to", "post on Dev.to".
triggers:
  - "dev.to article"
  - "devto article"
  - "publish to dev.to"
  - "publish to devto"
  - "post on dev.to"
  - "write for dev.to"
  - "dev.to post"
  - "devto post"
  - "Dev.to 文章"
  - "发布到 Dev.to"
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
    emoji: "👩‍💻"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Dev.to Article Writer

Write technical Dev.to articles with AI that resonate with developers. Topic research via [YouMind](https://youmind.com?utm_source=youmind-devto-article) knowledge base, developer-audience adapted writing, Markdown with front matter formatting, and one-click publishing to Dev.to through the user's Dev.to account already connected in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-devto-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Dev.to Article Writer installed!**
>
> Tell me your topic and I'll write and publish a Dev.to article for you.
>
> **Try it now:** "Write a Dev.to article about building CLI tools with TypeScript"
>
> **What it does:**
> - Research topics from trending developer discussions and your YouMind knowledge base
> - Write technical articles with proper code examples and structure
> - Format with Dev.to front matter (tags, cover image, series)
> - Validate content for Dev.to best practices
> - Publish directly to Dev.to (as draft or public) through the Dev.to account connected in YouMind
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article) and fill `youmind.api_key` in `config.yaml`
> 3. Keep `youmind.base_url` pointed at `https://youmind.com/openapi/v1` in docs. If you need local backend debugging, change only your local `config.yaml`.
> 4. Connect your Dev.to account inside YouMind before publishing. This skill no longer reads `devto.api_key` locally.
>
> No Dev.to connection yet? You can still write and preview locally — just skip the publish step.
>
> **Need help?** Just ask!

## Usage

Provide a topic, a raw Markdown file, or describe the article you want.

**Write from a topic:**
> Write a Dev.to article about building REST APIs with Hono and Bun

**Write with specific tags:**
> Write a Dev.to post about React Server Components, tag it with react, webdev, javascript

**Publish existing Markdown:**
> Publish this markdown to Dev.to as a draft

**Validate before publishing:**
> Validate my article for Dev.to best practices

## Setup

> Prerequisites: Node.js >= 18, a YouMind API key, and a Dev.to account connected in YouMind if you want to publish.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 -- Get YouMind API Key

YouMind API Key enables knowledge base search, web search, article archiving, and Dev.to publishing.

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`
5. Keep `youmind.base_url` as `https://youmind.com/openapi/v1` in examples and documentation. Local backend testing should only override your local `config.yaml`.

### Step 4 -- Connect Dev.to in YouMind

1. Open YouMind and connect your Dev.to account in the product's publishing / platform settings flow
2. Save the Dev.to token there once
3. Keep only `youmind.api_key` in this skill's `config.yaml`

### Verify Setup

After configuration, try:

> "Write a Dev.to article about TypeScript best practices"

If something is misconfigured, the skill will report what needs fixing at the relevant step.

When a post is created as a draft, tell the user it is in the Dev.to dashboard (`https://dev.to/dashboard`). Do not present the public article URL as if it is already accessible, because Dev.to draft URLs can 404 until published. If the user wants immediate publishing, use `published: true` / `--publish`.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution (Steps 1-7) | When running the writing pipeline |
| `references/content-adaptation.md` | Dev.to writing rules, structure, tone | Step 4 (content adaptation) |
| `references/api-reference.md` | YouMind Dev.to OpenAPI endpoint documentation | When calling Dev.to through YouMind |
| `config.yaml` | API credentials (YouMind only) | Step 1 (config load) |
| `output/` | **Local article Markdown drafts (git-ignored)** | When writing the article |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

## Draft Location Rule (MANDATORY)

**All local article Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-devto-article/output/my-article.md`
- Wrong: `skills/youmind-devto-article/my-article.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-post.md`), and prefer descriptive slugs over timestamps.

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details of each step.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate the YouMind API key and Dev.to connection in YouMind | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic: web search, trending discussions | -- |
| 4 | Content adaptation: structure for Dev.to audience | `content-adaptation.md` |
| 5 | Write article with code examples, TL;DR, proper structure | -- |
| 6 | Publish to Dev.to (draft or public) | `api-reference.md` |
| 7 | Report results: title, URL, tags, published status | -- |

**Routing shortcuts:**

- User gave a specific topic -> Skip broad research, go to Step 4
- User gave raw Markdown -> Skip to Step 6 (publish)

---

## Critical Quality Rules

Non-negotiable for every Dev.to article:

1. **TL;DR at the top.** Every article must open with a concise summary.
2. **Code blocks must have language tags.** Never use bare triple backticks.
3. **Problem-Solution-Code-Result structure.** Readers come for solutions, not theory.
4. **Title: 60-80 characters, keyword-front-loaded.** Dev.to titles must be searchable.
5. **Max 4 tags, lowercase, alphanumeric + hyphens only.** Dev.to enforces this.
6. **No marketing language.** No "revolutionize", "game-changing", "unlock the power of". Write like a developer talking to developers.
7. **Every claim needs evidence.** Code example, benchmark, link to docs, or personal experience.
8. **Word count: 800-2500.** Enough depth without padding.
9. **Description: max 170 characters.** Used in SEO meta description and social previews.
10. **No clickbait titles.** "You won't believe..." and "X things every developer must know" are anti-patterns.

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

**"The Tutorial Without Context":** Jumping straight into code without explaining why. Always set up the problem first.

**"The Marketing Fluff":** Using words like "revolutionary", "game-changing", "cutting-edge". Developers will stop reading.

**"The Wall of Text":** Long paragraphs without code blocks, headings, or visual breaks. Dev.to readers scan first.

**"The Outdated Example":** Using deprecated APIs or old syntax. Always verify code examples work with current versions.

**"The Tag Spam":** Using unrelated popular tags to get views. This hurts credibility and may get flagged.

## References

- YouMind Dev.to OpenAPI: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-devto-article
