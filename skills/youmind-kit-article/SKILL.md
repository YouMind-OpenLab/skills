---
name: youmind-kit-article
version: 1.0.0
description: |
  Write and publish Kit broadcasts with AI — topic research via YouMind knowledge base,
  creator-profile-aware broadcast writing, Markdown-to-HTML conversion, and publishing through
  the Kit account already connected in YouMind. Use when user wants to "write Kit article",
  "publish to Kit", "Kit broadcast", "ConvertKit article", "写 Kit 文章", "发布到 Kit".
triggers:
  - "kit article"
  - "publish to kit"
  - "kit broadcast"
  - "convertkit article"
  - "kit newsletter"
  - "写 kit 文章"
  - "发布到 kit"
  - "kit 发布"
  - "kit 邮件"
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
    emoji: "✉️"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Kit Broadcast Writer

Write creator-native Kit broadcasts with AI. Topic research via [YouMind](https://youmind.com?utm_source=youmind-kit-article) knowledge base, Kit-native broadcast writing, Markdown-to-HTML conversion, and one-click publishing through the user's Kit account already connected in YouMind.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-kit-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-kit-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Kit Broadcast Writer installed!**
>
> Tell me your topic and I'll write and publish a Kit broadcast for you.
>
> **Try it now:** "Write a Kit broadcast about what changed in our AI workflow this week"
>
> **What it does:**
> - Research topics from YouMind knowledge base and the web
> - Write creator-style broadcasts for Kit's inbox + public feed surfaces
> - Convert Markdown to HTML optimized for Kit
> - Discover usable email templates
> - Publish directly to Kit as public or private through the Kit account connected in YouMind
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && mkdir -p ~/.youmind/config && cp shared/config.example.yaml ~/.youmind/config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-kit-article) and fill `youmind.api_key` in `~/.youmind/config.yaml`
> 3. Keep `youmind.base_url` pointed at `https://youmind.com/openapi/v1` in docs. If you need local backend debugging, change `~/.youmind/config.yaml` or `~/.youmind/config/youmind-kit-article.yaml`.
> 4. Connect your Kit account inside YouMind before publishing. This skill no longer reads local Kit API keys.
>
> **Important:**
> - Kit sender email must already be confirmed, otherwise broadcast creation can fail.
> - Private broadcasts are best checked in `https://app.kit.com/campaigns`.
> - Public web URLs are not guaranteed to come back from the API; if missing, check the Broadcast report page and click `Open`.
>
> No Kit connection yet? You can still write and preview locally — just skip the publish step.

## Usage

Provide a topic, a raw Markdown file, or describe the Kit broadcast you want.

**Write from a topic:**
> Write a Kit broadcast about the three workflow changes AI coding agents forced on our team

**Publish existing Markdown:**
> Publish this markdown to Kit as a public broadcast

**Manage existing broadcasts:**
> List my Kit broadcasts
> List my Kit email templates
> Publish this as a private Kit draft

## Setup

> Prerequisites: Node.js >= 18, a YouMind API key, and a Kit account connected in YouMind if you want to publish.

### Step 1 -- Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 -- Create Config File

```bash
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

> **Canonical credentials:** put your shared YouMind credentials in `~/.youmind/config.yaml` — filled ONCE and read by every YouMind skill. See [`shared/config.example.yaml`](shared/config.example.yaml) for the template and [`shared/YOUMIND_HOME.md`](shared/YOUMIND_HOME.md). Optional skill overrides live in `~/.youmind/config/youmind-kit-article.yaml`.

### Step 3 -- Get YouMind API Key

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-kit-article)
2. Click **Create API Key**
3. Copy the `sk-ym-xxxx` key
4. Fill in `~/.youmind/config.yaml` under `youmind.api_key`
5. Keep `youmind.base_url` as `https://youmind.com/openapi/v1` in examples and documentation. Local backend testing should only override `~/.youmind/config.yaml` or `~/.youmind/config/youmind-kit-article.yaml`.

### Step 4 -- Connect Kit in YouMind

1. Open YouMind and connect your Kit account in the product's publishing / connector settings flow
2. Save the Kit API key there once
3. Confirm the sender email inside Kit before trying to create broadcasts
4. Keep only `youmind.api_key` in `~/.youmind/config.yaml`

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
| `references/pipeline.md` | Full step-by-step execution | When running the broadcast pipeline |
| `references/platform-dna.md` | Kit creator-profile, newsletter-feed, and broadcast norms | Before any content work |
| `references/content-generation-playbook.md` | Idea → Kit-native broadcast workflow | When generating new content |
| `references/content-adaptation-playbook.md` | Existing article → Kit-native workflow | When adapting/cross-posting content |
| `references/content-adaptation.md` | Supplemental Kit writing rules | Supplementary reference |
| `references/api-reference.md` | YouMind Kit OpenAPI endpoint documentation | When calling Kit through YouMind |
| `~/.youmind/config.yaml` | Shared API credentials (YouMind only) | Step 1 |
| `output/` | **Local article Markdown drafts (git-ignored)** | When writing the broadcast |
| `toolkit/dist/*.js` | Executable scripts (run from `toolkit/`) | Various steps |

## Draft Location Rule

**Canonical:** write local article Markdown files to `~/.youmind/articles/kit/<slug>.md`. This shared home directory is available to all YouMind skills — see [`shared/YOUMIND_HOME.md`](shared/YOUMIND_HOME.md).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-kit-article/output/<slug>.md`.

- Correct: `~/.youmind/articles/kit/my-broadcast.md`
- Correct (legacy): `skills/youmind-kit-article/output/my-broadcast.md`
- Wrong: skill root directly, `references/`, `toolkit/`, or an ad-hoc `drafts/` directory

Both locations are git-ignored. Create directories on demand (`mkdir -p ~/.youmind/articles/kit`). Kebab-case filenames (`my-broadcast.md`), descriptive slugs over timestamps.

## Dispatch Integration (Optional)

This skill is **self-contained and fully usable standalone.** The `youmind-article-dispatch` hub is an optional companion; it is NOT required for anything.

- **Primary mode — standalone:** Invoke directly ("Write a Kit broadcast about X"). Works with zero other YouMind skills installed.
- **Author voice lookup:** This skill reads `~/.youmind/author-profile.yaml` (shared home directory — see `shared/YOUMIND_HOME.md`) for cross-platform voice preferences. Works whether or not dispatch is installed.
- **Optional dispatch-mode invocation:** When dispatch invokes this skill with a content brief containing `resolved_author`, the skill uses those fields as extra context, but still applies Kit-native requirements like subject/preview alignment, creator-profile fit, and campaigns/public-feed behavior.
- **Capability manifest (opt-in):** `dispatch-capabilities.yaml` is metadata that lets dispatch route intelligently. Deleting it reverts to defaults; it never breaks this skill.
- **Optional interop protocol:** [`shared/DISPATCH_CONTRACT.md`](shared/DISPATCH_CONTRACT.md) (v1.0).

## Content Modes

Before writing any content, read `references/platform-dna.md` to internalize Kit's actual product surfaces: broadcasts, creator profile newsletter feed, and creator-network discoverability.

### Intent routing

| User's input | Operation | Playbook to load |
|--------------|-----------|-----------------|
| Idea, topic, or thesis only | Generate | `references/content-generation-playbook.md` |
| Existing article from blog/other platform | Cross-post | `references/content-adaptation-playbook.md` |
| Long article → broadcast version | Condense | `references/content-adaptation-playbook.md` (condense mode) |
| Old broadcast to refresh | Revive | `references/content-adaptation-playbook.md` (revive mode) |
| Section → short public-post teaser | Excerpt | `references/content-adaptation-playbook.md` (excerpt mode) |

### Quality gates (before publish)

1. **Self-critique**: Pass all checklist items in the playbook's Step 6
2. **Conformance report**: Generate and present to user (Step 7/8)
3. **Kit fit**: Subject + preview + first screen + CTA are aligned
4. **User approval**: Do not auto-publish without confirmation

### Result Links Rule

After any draft, scheduled, or published Kit action, always end with `Result links`.

- Prefer the public post URL when it exists.
- Include the best Kit management entry point when the post is private or the API did not return a stable public URL.
- Private broadcasts should explicitly point the user to `https://app.kit.com/campaigns`.
- If the user needs the exact public URL and the API response omitted it, tell them to open the Broadcast report in Kit and click `Open`.
- Never leave the user with only a broadcast ID.

## Pipeline Overview

Read `references/pipeline.md` for full execution details.

| Step | Action | Key reference |
|------|--------|--------------|
| 1 | Load config and validate the YouMind API key, paid-plan access, and Kit connection in YouMind | -- |
| 2 | Mine YouMind knowledge base for source material | -- |
| 3 | Research topic via web search | -- |
| 4 | If needed, inspect Kit email templates and decide public/private mode | `references/api-reference.md` |
| 5 | Adapt content for Kit's inbox + public-feed surfaces | `references/content-adaptation.md` |
| 6 | Write article in Markdown | -- |
| 7 | Publish to Kit via YouMind Kit OpenAPI | `references/api-reference.md` |
| 8 | Report results: broadcast ID, visibility, public URL if available, and fallback links | -- |

**Routing shortcuts:**
- `List my Kit email templates` → inspect templates before writing
- `Make it private` → private broadcast + campaigns fallback
- `Make it public` → public creator-profile/newsletter-feed post
