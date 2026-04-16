---
name: youmind-ghost-article
version: 1.0
description: |
  Write and publish Ghost articles with AI — topic research via YouMind knowledge base,
  Ghost-oriented writing, Markdown-to-HTML conversion, feature image upload, and one-click publishing.
  Use when user wants to "write Ghost article", "publish to Ghost", "Ghost 文章", "发布到 Ghost".
triggers:
  - "ghost article"
  - "publish to ghost"
  - "ghost post"
  - "Ghost 文章"
  - "发布到 Ghost"
  - "写 Ghost 文章"
  - "Ghost 博客"
  - "Ghost 发布"
  - "write ghost"
  - "ghost publish"
  - "ghost blog"
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
    emoji: "👻"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Ghost Article Writer

Write professional Ghost articles with AI. Topic research via [YouMind](https://youmind.com?utm_source=youmind-ghost-article) knowledge base, Ghost-oriented writing, Markdown-to-HTML conversion, feature image upload, and one-click publishing to Ghost through the user's Ghost account already connected in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-ghost-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Ghost Article Writer installed!**
>
> Tell me your topic and I'll write and publish a Ghost article for you.
>
> **Try it now:** "Write a Ghost article about AI programming trends"
>
> **What it does:**
> - Research topics from YouMind knowledge base and the web
> - Write clean Ghost-style articles in Markdown
> - Convert Markdown to HTML optimized for Ghost
> - Upload feature images
> - Publish directly to Ghost as draft or public through the Ghost account connected in YouMind
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) and fill `youmind.api_key` in `config.yaml`
> 3. Keep `youmind.base_url` pointed at `https://youmind.com/openapi/v1` in docs. If you need local backend debugging, change only your local `config.yaml`.
> 4. Connect your Ghost account inside YouMind before publishing. This skill no longer reads `ghost.admin_api_key` or `ghost.site_url` locally.
>
> No Ghost connection yet? You can still write and preview locally — just skip the publish step.
>
> **Need help?** Just ask!

## Usage

Provide a topic, a raw Markdown file, or describe the Ghost article you want.

**Write from a topic:**
> Write a Ghost article about the workflow changes AI coding agents introduced

**Publish existing Markdown:**
> Publish this markdown to Ghost as a draft

**Manage existing posts:**
> List my Ghost drafts
> Publish Ghost post 69de04770c17b300017b5650
> Move Ghost post 69de04770c17b300017b5650 back to draft

## Setup

> Prerequisites: Node.js >= 18, a YouMind API key, and a Ghost account connected in YouMind if you want to publish.

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

YouMind API Key enables knowledge base search, web search, article archiving, and Ghost publishing.

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `config.yaml` under `youmind.api_key`
5. Keep `youmind.base_url` as `https://youmind.com/openapi/v1` in examples and documentation. Local backend testing should only override your local `config.yaml`.

### Step 4 -- Connect Ghost in YouMind

1. Open YouMind and connect your Ghost account in the product's publishing / connector settings flow
2. Save the Ghost site URL and Admin API key there once
3. Keep only `youmind.api_key` in this skill's `config.yaml`

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

If the account is not connected, the OpenAPI returns a connector URL pointing to `https://youmind.com/settings/connector`.

If the current plan is not eligible, the OpenAPI returns `402` and points the user to `https://youmind.com/pricing`.

## Skill Directory

This skill is a folder. Read files on demand -- do NOT load everything upfront.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full step-by-step execution | When running the writing pipeline |
| `references/platform-dna.md` | Ghost audience, newsletter metrics, format constraints | Before any content work |
| `references/content-generation-playbook.md` | Idea → Ghost-native draft workflow | When generating new content |
| `references/content-adaptation-playbook.md` | Existing article → Ghost-native workflow | When adapting/cross-posting content |
| `references/content-adaptation.md` | Ghost writing rules, structure, tone (legacy) | Supplementary reference |
| `references/api-reference.md` | YouMind Ghost OpenAPI endpoint documentation | When calling Ghost through YouMind |
| `config.yaml` | API credentials (YouMind only) | Step 1 |
| `output/` | **Local article Markdown drafts (git-ignored)** | When writing the article |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

## Draft Location Rule

**Canonical:** write local article Markdown files to `~/.youmind/articles/ghost/<slug>.md`. This shared home directory is available to all YouMind skills — see [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-ghost-article/output/<slug>.md`.

- Correct: `~/.youmind/articles/ghost/my-article.md`
- Correct (legacy): `skills/youmind-ghost-article/output/my-article.md`
- Wrong: skill root directly, `references/`, `toolkit/`, or an ad-hoc `drafts/` directory

Both locations are git-ignored. Create directories on demand (`mkdir -p ~/.youmind/articles/ghost`). Kebab-case filenames (`my-article.md`), descriptive slugs over timestamps.
## Dispatch Integration (Optional)

This skill is **self-contained and fully usable standalone.** The `youmind-article-dispatch` hub is an optional companion; it is NOT required for anything.

- **Primary mode — standalone:** Invoke directly ("Write a Ghost article about X"). Works with zero other YouMind skills installed.
- **Author voice lookup:** This skill reads `~/.youmind/author-profile.yaml` (shared home directory — see `/shared/YOUMIND_HOME.md`) for cross-platform voice preferences. Works whether or not dispatch is installed.
- **Optional dispatch-mode invocation:** When dispatch invokes this skill with a content brief containing `resolved_author`, the skill uses those fields as extra context (custom excerpt + email-safe HTML discipline stay native to this skill). Without such a brief, the skill runs its own pipeline normally.
- **Capability manifest (opt-in):** `dispatch-capabilities.yaml` is metadata that lets dispatch route intelligently. Deleting it reverts to defaults; it never breaks this skill.
- **Optional interop protocol:** [`/shared/DISPATCH_CONTRACT.md`](/shared/DISPATCH_CONTRACT.md) (v1.0).

---

## Content Modes

Before writing any content, read `references/platform-dna.md` to internalize Ghost's newsletter-first format (53% open rate, 6.3% free→paid conversion, 73% retention with weekly cadence).

### Intent routing

| User's input | Operation | Playbook to load |
|--------------|-----------|-----------------|
| Idea, topic, or thesis only | Generate | `references/content-generation-playbook.md` |
| Existing article from blog/other platform | Cross-post | `references/content-adaptation-playbook.md` |
| Long article → newsletter version | Condense | `content-adaptation-playbook.md` (condense mode) |
| Old Ghost post to update | Revive | `content-adaptation-playbook.md` (revive mode) |
| Section → bookmark card content | Excerpt | `content-adaptation-playbook.md` (excerpt mode) |

### Quality gates (before publish)

1. **Self-critique**: Pass all checklist items in the playbook's Step 6
2. **Conformance report**: Generate and present to user (Step 7/8)
3. **Newsletter readiness**: Custom excerpt + email-safe HTML + CTA verified
4. **User approval**: Do not auto-publish without confirmation

---

## Pipeline Overview

Read `references/pipeline.md` for full execution details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate the YouMind API key, paid-plan access, and Ghost connection in YouMind | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic via web search | -- |
| 4 | Adapt content for Ghost audience and HTML rendering | `content-adaptation.md` |
| 5 | Write article in Markdown | -- |
| 6 | Publish to Ghost via YouMind Ghost OpenAPI | `api-reference.md` |
| 7 | Report results: post ID, status, public URL, Ghost Admin URL | -- |

**Routing shortcuts:**

- User gave a specific topic -> Skip broad research, go to Step 4
- User gave raw Markdown -> Skip to Step 6 (publish)
- User wants preview only -> Run local conversion, skip publishing

## Critical Quality Rules

Non-negotiable for every Ghost article:

1. **Write for real readers, not SEO sludge.** Ghost audiences expect an editorial tone.
2. **Keep paragraphs short.** The same content may be read on web and in email newsletters.
3. **Use meaningful section headings.** Ghost posts need strong structure.
4. **Custom excerpt matters.** It drives cards, previews, and newsletter subject/context.
5. **Tags should be intentional.** The first tag becomes primary routing context.
6. **Avoid raw Markdown assumptions.** Ghost publishing goes through HTML conversion, so check code blocks and embeds carefully.
7. **Default to draft.** Do not surprise the user by publishing publicly unless asked.

## Resilience: Never Stop on a Single-Step Failure

Every step has a fallback. If a step AND its fallback both fail, skip and note it in the final output.

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty knowledge context |
| 3 Research | Ask user for manual input |
| 6 Publishing | Generate local HTML preview |
| 7 Archiving | Warn, continue |

## References

- YouMind Ghost OpenAPI: see [references/api-reference.md](references/api-reference.md)
- Content rules: see [references/content-adaptation.md](references/content-adaptation.md)
- Pipeline: see [references/pipeline.md](references/pipeline.md)
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-ghost-article
