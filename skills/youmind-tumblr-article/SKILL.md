---
name: youmind-tumblr-article
version: 1.1.0
description: |
  Write and publish Tumblr-native posts with AI — topic shaping via YouMind knowledge base,
  Tumblr-first long-form writing, image-led publishing, notes/activity review, and queue control
  through the Tumblr blog already connected in YouMind.
  Use when user wants to "tumblr post", "publish to tumblr", "tumblr article", "tumblr photo post",
  "read tumblr notes", "Tumblr 文章", "发布到 Tumblr", "看 Tumblr 评论".
  Do NOT trigger for: X threads, WeChat articles, newsletters, PPT, or short video scripts.
triggers:
  - "tumblr post"
  - "publish to tumblr"
  - "tumblr article"
  - "tumblr photo post"
  - "tumblr notes"
  - "tumblr blog"
  - "Tumblr 文章"
  - "发布到 Tumblr"
  - "写 Tumblr 文章"
  - "看 Tumblr 评论"
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
    emoji: "🌀"
    requires:
      anyBins: ["node", "npm"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Tumblr Publisher

Tumblr 不是“再发一份博客备份”。这个 skill 要做的是：把内容变成 Tumblr 会吃的形态，再通过 YouMind OpenAPI 发出去，并且能继续读 notes / notifications / followers / limits 做下一轮分发判断。

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-tumblr-article) · [More Skills →](https://youmind.com/skills?utm_source=youmind-tumblr-article)

## Onboarding

**MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **AI Tumblr Publisher installed!**
>
> Tell me your topic, draft, or image idea and I’ll turn it into a Tumblr-native post.
>
> **Try it now:** "Write a Tumblr post about the hidden cost of maintaining AI agents"
>
> **What it does:**
> - Mine ideas from your YouMind knowledge base and shape them for Tumblr
> - Write Tumblr-native text posts with stronger feed openings and clearer POV
> - Publish image-led Tumblr photo posts from public image URLs
> - Read notes, activity notifications, follower snapshots, and account limits
> - Reorder or shuffle the Tumblr queue when you want to tune publishing rhythm
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && mkdir -p ~/.youmind/config && cp shared/config.example.yaml ~/.youmind/config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-tumblr-article) and fill `youmind.api_key` in `~/.youmind/config.yaml`
> 3. Connect your Tumblr account inside YouMind via the Connector Settings Tumblr OAuth flow
> 4. If you need local backend debugging, only override `~/.youmind/config.yaml` or `~/.youmind/config/youmind-tumblr-article.yaml`
>
> No Tumblr connection yet? You can still write and preview locally — just skip the publish step.

## Usage

Provide a topic, Markdown draft, image URL, or an existing Tumblr post ID.

- `Write a Tumblr post about why product teams overestimate AI automation`
- `Publish this Markdown draft to Tumblr`
- `Publish this image as a Tumblr photo post with a short caption`
- `Show me the notes on this Tumblr post`
- `Check my Tumblr activity notifications`
- `Move this queued Tumblr post to the top`

## Setup

> Prerequisites: Node.js >= 18, a YouMind API key, and a Tumblr account connected in YouMind if you want to publish.

```bash
cd toolkit && npm install && npm run build && cd ..
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

> **Canonical credentials:** put your shared YouMind credentials in `~/.youmind/config.yaml` — filled once and read by every YouMind skill. Optional skill overrides live in `~/.youmind/config/youmind-tumblr-article.yaml`. See [`shared/YOUMIND_HOME.md`](shared/YOUMIND_HOME.md).

Get the API key from [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-tumblr-article), connect Tumblr in [Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-tumblr-article), then verify:

```bash
cd toolkit && node dist/cli.js validate
```

## Skill Directory

Read files on demand. Do not load everything up front.

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/platform-dna.md` | Tumblr surfaces, reblog/notes logic, visual-fit decisions | Before any content work |
| `references/pipeline.md` | End-to-end execution lanes | Before running the workflow |
| `references/content-generation-playbook.md` | Topic → Tumblr-native text/photo post | When generating from an idea |
| `references/content-adaptation-playbook.md` | Existing article/image → Tumblr-native version | When adapting or cross-posting |
| `references/media-playbook.md` | When to use photo post vs text post with lead image | Before image-led publishing |
| `references/engagement-playbook.md` | Notes / notifications / followers / limits review | When reading feedback |
| `references/api-reference.md` | YouMind Tumblr OpenAPI + CLI contract | When calling Tumblr through YouMind |

## Draft Location Rule

**Canonical:** write local adapted drafts to `~/.youmind/articles/tumblr/<slug>.html`. This shared home directory is available to all YouMind skills — see [`shared/YOUMIND_HOME.md`](shared/YOUMIND_HOME.md).

**Legacy fallback** (if `~/.youmind/` is not writable): `skills/youmind-tumblr-article/output/<slug>.html`.

- Correct: `~/.youmind/articles/tumblr/my-post.html`
- Correct (legacy): `skills/youmind-tumblr-article/output/my-post.html`
- Wrong: skill root directly, `references/`, `toolkit/`, or an ad-hoc `drafts/` directory

## Dispatch Integration (Optional)

This skill is self-contained. The `youmind-article-dispatch` hub is optional.

- **Primary mode — standalone:** Invoke directly ("Write a Tumblr post about X"). Works without other YouMind skills.
- **Author voice lookup:** This skill may read `~/.youmind/author-profile.yaml` for cross-platform voice preferences.
- **Optional dispatch-mode invocation:** If dispatch passes `resolved_author`, use it as voice/audience context, but still obey Tumblr-native adaptation rules.
- **Capability manifest:** `dispatch-capabilities.yaml` tells dispatch that Tumblr is strongest for conversational long-form posts, image-led updates, and feedback-aware iteration.

## Content Modes

Before writing, read `references/platform-dna.md`.

### Intent routing

| User input | Operation | Playbook |
|------------|-----------|----------|
| Topic / rough idea | Generate | `references/content-generation-playbook.md` |
| Existing article / Markdown draft | Adapt | `references/content-adaptation-playbook.md` |
| Existing image + short angle | Photo post | `references/media-playbook.md` |
| Existing Tumblr post ID + comments question | Feedback review | `references/engagement-playbook.md` |
| Queue/order request | Queue management | `references/engagement-playbook.md` |

### Critical quality rules

1. **Tumblr-first, not CMS-first**: do not dump raw SEO blog structure into Tumblr.
2. **Opening paragraph must work in-feed**: the first screen should justify the click.
3. **Choose the right format**: use photo posts when the image is the object, not just decoration.
4. **Simple HTML only**: avoid scripts, fragile embeds, and layout-heavy markup.
5. **Tags are discovery cues, not keyword stuffing**: 3-8 focused tags beats a long noisy list.
6. **Notes matter more than vanity polish**: write for reblogs, replies, and quotable lines.
7. **Never hand-wave result links**: return the exact post URL when available, otherwise the blog URL fallback.

## Result Links Rule

After any publish action, always end with `Result links`.

- Prefer the direct Tumblr post URL
- If no exact post URL is available, return the best blog URL instead
- Never leave the user with only a raw post ID

## Pipeline Overview

See `references/pipeline.md` for the detailed workflow.

- Text publishing lane: topic → draft → HTML adaptation → publish
- Photo publishing lane: choose format → caption shaping → image post publish
- Feedback lane: notes / notifications / followers / limits → insight extraction
- Queue lane: draft / queue review → reorder / shuffle → republish decision

## Resilience

Every major action has a fallback:

- Text publish fails → save adapted HTML locally
- Photo publish fails → save caption HTML locally and return the image URL
- Notes endpoint fails → fall back to notifications + blog URL guidance
- Exact post URL missing → use the blog-level Tumblr URL

If a step and its fallback both fail, note it clearly and continue with the rest of the workflow.
