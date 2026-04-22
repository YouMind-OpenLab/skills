---
name: youmind-beehiiv-article
version: 1.0.0
description: |
  Write and publish Beehiiv posts with AI — topic research via YouMind knowledge base,
  newsletter-publication writing, Markdown-to-HTML conversion, and publishing through the
  Beehiiv account already connected in YouMind. Use when user wants to "write Beehiiv article",
  "publish to Beehiiv", "Beehiiv post", "Beehiiv newsletter", "写 Beehiiv 文章", "发布到 Beehiiv".
triggers:
  - "beehiiv article"
  - "publish to beehiiv"
  - "beehiiv post"
  - "beehiiv newsletter"
  - "写 beehiiv 文章"
  - "发布到 beehiiv"
  - "beehiiv 发布"
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
    emoji: "🐝"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Beehiiv Post Writer

Write publication-native Beehiiv posts with AI. Topic research via [YouMind](https://youmind.com?utm_source=youmind-beehiiv-article) knowledge base, Beehiiv-native post writing, Markdown-to-HTML conversion, and one-click publishing through the user's Beehiiv account already connected in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-beehiiv-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-beehiiv-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Beehiiv Post Writer installed!**
>
> Tell me your topic and I'll write and publish a Beehiiv post for you.
>
> **Try it now:** "Write a Beehiiv post about how AI coding agents changed weekly product updates"
>
> **What it does:**
> - Research topics from YouMind knowledge base and the web
> - Write Beehiiv-native posts for the platform's email + web surfaces
> - Convert Markdown to HTML optimized for Beehiiv
> - Discover reusable post templates
> - Publish directly to Beehiiv through the Beehiiv account connected in YouMind
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && mkdir -p ~/.youmind/config && cp shared/config.example.yaml ~/.youmind/config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-beehiiv-article) and fill `youmind.api_key` in `~/.youmind/config.yaml`
> 3. Keep `youmind.base_url` pointed at `https://youmind.com/openapi/v1` in docs. If you need local backend debugging, change `~/.youmind/config.yaml` or `~/.youmind/config/youmind-beehiiv-article.yaml`.
> 4. Connect your Beehiiv account inside YouMind before publishing. This skill no longer reads local Beehiiv API keys.
>
> **Important:**
> - Beehiiv `createPost` can return `403` if the publication does not have the required Send API access.
> - Beehiiv officially marks `update post` as `beta / Enterprise`; do not promise it will be available everywhere.
> - If the user wants a recurring layout, inspect `listPostTemplates` first and use `postTemplateId`.
>
> No Beehiiv connection yet? You can still write and preview locally — just skip the publish step.

## Usage

Provide a topic, a raw Markdown file, or describe the Beehiiv post you want.

**Write from a topic:**
> Write a Beehiiv post about the operator lessons we learned after moving to AI-assisted engineering

**Publish existing Markdown:**
> Publish this markdown to Beehiiv as a draft

**Manage existing posts:**
> List my Beehiiv post templates
> List my Beehiiv drafts
> Publish this Beehiiv post immediately

## Setup

> Prerequisites: Node.js >= 18, a YouMind API key, and a Beehiiv account connected in YouMind if you want to publish.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

> **Canonical credentials:** put your shared YouMind credentials in `~/.youmind/config.yaml` — filled ONCE and read by every YouMind skill. See [`shared/config.example.yaml`](shared/config.example.yaml) for the template and [`shared/YOUMIND_HOME.md`](shared/YOUMIND_HOME.md). Optional skill overrides live in `~/.youmind/config/youmind-beehiiv-article.yaml`.

### Step 3 -- Get YouMind API Key

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-beehiiv-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `~/.youmind/config.yaml` under `youmind.api_key`
5. Keep `youmind.base_url` as `https://youmind.com/openapi/v1` in examples and documentation. Local backend testing should only override `~/.youmind/config.yaml` or `~/.youmind/config/youmind-beehiiv-article.yaml`.

### Step 4 -- Connect Beehiiv in YouMind

1. Open YouMind and connect your Beehiiv account in the product's publishing / connector settings flow
2. Save the Beehiiv API key and publication ID there once
3. Keep only `youmind.api_key` in `~/.youmind/config.yaml`

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
| `references/pipeline.md` | Full step-by-step execution | When running the Beehiiv pipeline |
| `references/platform-dna.md` | Beehiiv publication, email/web, segmentation, and template norms | Before any content work |
| `references/content-generation-playbook.md` | Idea → Beehiiv-native draft workflow | When generating new content |
| `references/content-adaptation-playbook.md` | Existing article → Beehiiv-native workflow | When adapting/cross-posting content |
| `references/content-adaptation.md` | Supplemental Beehiiv writing rules | Supplementary reference |
| `references/api-reference.md` | YouMind Beehiiv OpenAPI endpoint documentation | When calling Beehiiv through YouMind |
| `~/.youmind/config.yaml` | Shared API credentials (YouMind only) | Step 1 |
| `output/` | **Local article Markdown drafts (git-ignored)** | When writing the post |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

## Draft Location Rule

**Canonical:** write local article Markdown files to `~/.youmind/articles/beehiiv/<slug>.md`. This shared home directory is available to all YouMind skills — see [`shared/YOUMIND_HOME.md`](shared/YOUMIND_HOME.md).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-beehiiv-article/output/<slug>.md`.

- Correct: `~/.youmind/articles/beehiiv/my-post.md`
- Correct (legacy): `skills/youmind-beehiiv-article/output/my-post.md`
- Wrong: skill root directly, `references/`, `toolkit/`, or an ad-hoc `drafts/` directory

Both locations are git-ignored. Create directories on demand (`mkdir -p ~/.youmind/articles/beehiiv`). Kebab-case filenames (`my-post.md`), descriptive slugs over timestamps.

## Dispatch Integration (Optional)

This skill is **self-contained and fully usable standalone.** The `youmind-article-dispatch` hub is an optional companion; it is NOT required for anything.

- **Primary mode — standalone:** Invoke directly ("Write a Beehiiv post about X"). Works with zero other YouMind skills installed.
- **Author voice lookup:** This skill reads `~/.youmind/author-profile.yaml` (shared home directory — see `shared/YOUMIND_HOME.md`) for cross-platform voice preferences. Works whether or not dispatch is installed.
- **Optional dispatch-mode invocation:** When dispatch invokes this skill with a content brief containing `resolved_author`, the skill uses those fields as extra context, but still applies Beehiiv-native rules like email/web dual-surface fit, segmentation, and template-aware structure.
- **Capability manifest (opt-in):** `dispatch-capabilities.yaml` is metadata that lets dispatch route intelligently. Deleting it reverts to defaults; it never breaks this skill.
- **Optional interop protocol:** [`shared/DISPATCH_CONTRACT.md`](shared/DISPATCH_CONTRACT.md) (v1.0).

## Content Modes

Before writing any content, read `references/platform-dna.md` to internalize Beehiiv's actual post model: one post can serve email, web, segments, free/premium access, and reusable templates.

### Intent routing

| User's input | Operation | Playbook to load |
|--------------|-----------|-----------------|
| Idea, topic, or thesis only | Generate | `references/content-generation-playbook.md` |
| Existing article from blog/other platform | Cross-post | `references/content-adaptation-playbook.md` |
| Long article → Beehiiv post version | Condense | `references/content-adaptation-playbook.md` (condense mode) |
| Old Beehiiv post to refresh | Revive | `references/content-adaptation-playbook.md` (revive mode) |
| Section → short launch/update post | Excerpt | `references/content-adaptation-playbook.md` (excerpt mode) |

### Quality gates (before publish)

1. **Self-critique**: Pass all checklist items in the playbook's Step 6
2. **Conformance report**: Generate and present to user (Step 7/8)
3. **Beehiiv fit**: title + subtitle + first screen + segmentation/template decisions are aligned
4. **User approval**: Do not auto-publish without confirmation

### Result Links Rule

After any draft, scheduled, or published Beehiiv action, always end with `Result links`.

- Prefer the public Beehiiv web URL when it exists.
- If the post is still draft-only and has no public URL, clearly say so.
- If template choice, audience targeting, or Send API limitations affected the result, state that in the notes.
- Never leave the user with only a post ID when a public web URL is available.

## Pipeline Overview

Read `references/pipeline.md` for full execution details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate the YouMind API key, paid-plan access, and Beehiiv connection in YouMind | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic via web search | -- |
| 4 | Inspect Beehiiv post templates / audience needs when relevant | `references/api-reference.md` |
| 5 | Adapt content for Beehiiv's email + web + segmentation surfaces | `references/content-adaptation.md` |
| 6 | Write article in Markdown | -- |
| 7 | Publish to Beehiiv via YouMind Beehiiv OpenAPI | `references/api-reference.md` |
| 8 | Report results: post ID, status, public URL if available, and send/template caveats | -- |

**Routing shortcuts:**
- `List my Beehiiv post templates` → inspect reusable layout options before writing
- `Publish immediately` → `confirmed` flow, but warn about Send API access if certainty matters
- `Keep it as draft` → safest default
