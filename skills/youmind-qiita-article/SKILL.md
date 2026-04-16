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
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Qiita Article Writer

Write technical Qiita articles with AI that resonate with the Japanese developer community. Topic research via [YouMind](https://youmind.com?utm_source=youmind-qiita-article) knowledge base, developer-audience adapted writing, GFM Markdown with Qiita extensions, and one-click publishing to Qiita through the user's Qiita account already connected in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-qiita-article)

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
> 3. Keep `youmind.base_url` pointed at `https://youmind.com/openapi/v1` in docs. If you need local backend debugging, change only your local `config.yaml`.
> 4. Connect your Qiita account inside YouMind before publishing. This skill no longer reads `qiita.access_token` locally.
>
> No Qiita connection yet? You can still write and preview locally — just skip the publish step.
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

> Prerequisites: Node.js >= 18, a YouMind API key, and a Qiita account connected in YouMind if you want to publish.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
cp config.example.yaml config.yaml
```

> **Upgrade-safe credentials (recommended):** put your shared YouMind credentials in `~/.youmind/config.yaml` — filled ONCE and read by every YouMind skill. See [`/shared/config.example.yaml`](/shared/config.example.yaml) for the template and [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md) for the resolution order. Skill-local `config.yaml` remains a legacy fallback for this skill only. This skill has no skill-specific overrides.

### Step 3 -- Get YouMind API Key

YouMind API Key enables knowledge base search, web search, article archiving, and Qiita publishing.

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`
5. Keep `youmind.base_url` as `https://youmind.com/openapi/v1` in examples and documentation. Local backend testing should only override your local `config.yaml`.

### Step 4 -- Connect Qiita in YouMind

1. Open YouMind and connect your Qiita account in the product's publishing / platform settings flow (OAuth via the Connector Settings page)
2. Save the Qiita connection there once
3. Keep only `youmind.api_key` in this skill's `config.yaml`

### Verify Setup

After configuration, try:

> "Write a Qiita article about TypeScript best practices"

If something is misconfigured, the skill will report what needs fixing at the relevant step.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution (Steps 1-7) | When running the writing pipeline |
| `references/platform-dna.md` | Qiita audience, format constraints, community data | Before any content work |
| `references/content-generation-playbook.md` | Idea → Qiita-native draft workflow | When generating new content |
| `references/content-adaptation-playbook.md` | Existing article → Qiita-native workflow | When adapting/translating content |
| `references/content-adaptation.md` | Qiita writing rules, structure, tone (legacy) | Supplementary reference |
| `references/api-reference.md` | YouMind Qiita OpenAPI endpoint documentation | When calling Qiita through YouMind |
| `config.yaml` | API credentials (YouMind only) | Step 1 (config load) |
| `output/` | **Drafts and published articles (git-ignored)** | Step 5 (write/save article) |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

## Draft Location Rule

**Canonical:** write local article Markdown files to `~/.youmind/articles/qiita/<slug>.md`. This shared home directory is available to all YouMind skills — see [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-qiita-article/output/<slug>.md`.

- Correct: `~/.youmind/articles/qiita/my-article.md`
- Correct (legacy): `skills/youmind-qiita-article/output/my-article.md`
- Wrong: skill root directly, `references/`, `toolkit/`, or an ad-hoc `drafts/` directory

Both locations are git-ignored. Create directories on demand (`mkdir -p ~/.youmind/articles/qiita`). Kebab-case filenames (`my-article.md`), descriptive slugs over timestamps.
---

## Dispatch Integration (Optional)

This skill is **self-contained and fully usable standalone.** The `youmind-article-dispatch` hub is an optional companion; it is NOT required for anything.

- **Primary mode — standalone:** Invoke directly ("Qiita に記事を投稿する" / "Write a Qiita article about X"). Works with zero other YouMind skills installed.
- **Author voice lookup:** This skill reads `~/.youmind/author-profile.yaml` (shared home directory — see `/shared/YOUMIND_HOME.md`) for cross-platform voice preferences. Works whether or not dispatch is installed.
- **Optional dispatch-mode invocation:** When dispatch invokes this skill with a content brief containing `resolved_author`, the skill uses those fields as extra context. Qiita's 丁寧語 register and CDN hotlink handling stay native to this skill regardless of invocation path.
- **Capability manifest (opt-in):** `dispatch-capabilities.yaml` declares the `cdn_hotlink` flag so dispatch can warn about cdn.gooo.ai image URLs. Deleting the file reverts to defaults; it never breaks this skill.
- **Optional interop protocol:** [`/shared/DISPATCH_CONTRACT.md`](/shared/DISPATCH_CONTRACT.md) (v1.0).

---

## Content Modes

Before writing any content, read `references/platform-dna.md` to internalize Qiita's platform norms (1.5M members, 50M PV/mo, 丁寧語 register, `:::note` callouts, 宣伝臭い = community rejection).

### Intent routing

| User's input | Operation | Playbook to load |
|--------------|-----------|-----------------|
| Idea, topic, or talking points only | Generate | `references/content-generation-playbook.md` |
| English article → Qiita Japanese | Translate | `references/content-adaptation-playbook.md` (translate mode) |
| Existing article from blog/other platform | Cross-post | `references/content-adaptation-playbook.md` |
| Old Qiita article to refresh | Revive | `content-adaptation-playbook.md` (revive mode) |
| Long piece to trim | Condense | `content-adaptation-playbook.md` (condense mode) |

### Quality gates (before publish)

1. **Self-critique**: Pass all checklist items in the playbook's Step 6
2. **Conformance report**: Generate and present to user (Step 7/8)
3. **Image check**: Zero `cdn.gooo.ai` URLs in final body
4. **User approval**: Do not auto-publish without confirmation

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details of each step.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate the YouMind API key and Qiita connection in YouMind | -- |
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

- YouMind Qiita OpenAPI: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-qiita-article
