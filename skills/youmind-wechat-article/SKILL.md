---
name: youmind-wechat-article
version: 2.1.0
description: |
  Write and publish WeChat Official Account articles end-to-end with AI, or take an existing
  draft straight into the skill's built-in formatting + direct-send capability. Supports full
  pipeline from topic, plus ready-article direct send when the article is already written.
  Use when user says "写公众号文章" / "微信推文" / "发布到草稿箱" / "微信排版" / "WeChat publish".
  Do NOT trigger for: generic blogs, newsletters, PPT, short-video scripts, non-WeChat SEO work.
triggers:
  - "公众号"
  - "微信公众号"
  - "写公众号"
  - "微信推文"
  - "草稿箱"
  - "微信排版"
  - "选题"
  - "封面图"
  - "配图"
  - "把这篇文章发到草稿箱"
  - "微信发文"
  - "WeChat article"
  - "WeChat publish"
  - "publish to WeChat"
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
    emoji: "✍️"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["node", "npm", "python3"]
      env: ["YOUMIND_API_KEY"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(python3 scripts/*)
  - Bash(npm install)
  - Bash(npm run build)
  - Bash([ -n "$YOUMIND_API_KEY" ] *)
---

# AI WeChat Article Writer — From Topic to Draft Box in One Prompt

Write professional WeChat Official Account articles with AI that doesn't sound like AI. Full mode handles topic mining → research → writing → themed formatting → cover generation → draft-box publishing. For ready articles, the skill also has a built-in formatting + direct-send capability that skips the writing pipeline and sends the article straight to the draft box.

> [Get API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article) · [More Skills →](https://youmind.com/skills?utm_source=youmind-wechat-article)

## Onboarding

**⚠️ MANDATORY: When the user just installed this skill, show this message IMMEDIATELY. Translate to the user's language:**

> **✅ AI WeChat Article Writer installed!**
>
> Tell me a topic or paste a finished draft — I'll either write it end-to-end or just format and publish it to your WeChat draft box.
>
> **Try it now:** "帮我写一篇关于 AI 编程的公众号文章"
>
> **What it does:** full article pipeline when you need writing, or built-in formatting + direct send when the article is already ready.
>
> **Setup (one-time):**
> 1. `cd toolkit && npm install && npm run build && cd .. && pip install -r requirements.txt && mkdir -p ~/.youmind/config && cp shared/config.example.yaml ~/.youmind/config.yaml`
> 2. Get a [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-wechat-article) → fill `youmind.api_key` in `~/.youmind/config.yaml`
> 3. Bind your WeChat Official Account in [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wechat-article) (paste AppID + AppSecret; YouMind encrypts + proxies, no IP whitelist needed)
>
> `preview` and `themes` work without WeChat connection. **Need help?** Just ask.

For first-run setup and client onboarding details, see [`references/operations.md`](references/operations.md).

## Usage

Provide a topic, brand/client name, or a finished article:

- `帮我写一篇关于 AI 编程趋势的公众号文章` — full pipeline from topic
- `给 demo 客户写一篇推文，主题是远程办公` — client-scoped run
- `把这篇 Markdown 排版成公众号样式并发布到草稿箱` — skip writing, publish only
- `把这篇现成文章直接发到公众号` — keep the article as source of truth, do a light WeChat fit pass, then publish
- `用交互模式…` — pause at topic / framework / image / theme decisions

## Setup

> Prerequisites: Node.js ≥ 18, Python ≥ 3.9, a verified WeChat Official Account bound in YouMind Connector Settings.

Run the one-time setup from [`references/setup.md`](references/setup.md), then verify with:

```bash
node toolkit/dist/cli.js validate
```

For screenshots and connector binding walkthroughs, see [README.md §安装](README.md). For onboarding and post-setup operations, see [`references/operations.md`](references/operations.md).

## Skill Directory

Read files on demand — do NOT load everything upfront. Five always-relevant entries below; full inventory in [`references/skill-directory.md`](references/skill-directory.md).

| Path | When to read |
|------|-------------|
| `references/platform-dna.md` | Before any content work |
| `references/content-generation-playbook.md` | Generating from a topic/idea |
| `references/content-adaptation-playbook.md` | Adapting existing article |
| `references/pipeline.md` | Running the writing pipeline |
| `references/writing-guide.md` | Step 4 (writing + de-AI) |
| `references/skill-directory.md` | Full file inventory (Tier 2/3 + clients + toolkit) |

## Draft Location Rule

Write drafts to `~/.youmind/articles/wechat/<client>/<slug>.md`; only fall back to `output/` if `~/.youmind/` is unavailable.

For the full path contract, dispatch interop, execution modes, and result-links behavior, see [`references/runtime-rules.md`](references/runtime-rules.md).

---

## Dispatch Integration (Optional)

Standalone by default. If you need dispatch interop details, read [`references/runtime-rules.md`](references/runtime-rules.md).

When dispatch or the caller makes it clear that the article is already finished, skip topic mining, hotspot research, framework selection, and fresh drafting. Use the supplied article as source of truth and switch to the skill's built-in formatting + direct-send capability.

---

## Content Modes

Before writing, read [`references/platform-dna.md`](references/platform-dna.md) (index → `writing-guide.md`, `style-template.md`, `wechat-constraints.md`). Use the specialized playbooks it points to only when the draft needs them.

**Intent routing:**
- Topic/idea only → [`content-generation-playbook.md`](references/content-generation-playbook.md)
- English article → Chinese 公众号 → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) (`localize` mode)
- Japanese/other-language article → Chinese 公众号 → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) (`translate` mode)
- Existing article from blog/other platform → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) (`cross-post` mode)
- Ready article + publish-only / formatting request → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) using the skill's built-in formatting + direct-send capability
- Western long-form / oversized draft → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) (`condense` mode)
- Old 公众号 article → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) (`revive` mode)
- Section from a larger work → [`content-adaptation-playbook.md`](references/content-adaptation-playbook.md) (`excerpt` mode)

**Quality gates before publish:** (1) de-AI pass per `writing-guide.md`, (2) playbook Step 6 self-critique, (3) Step 7/8 conformance report, (4) auto-publish to draft box (mandatory).

---

## Execution Modes

The skill has two modes: `auto` and `interactive`.

Read [`references/runtime-rules.md`](references/runtime-rules.md) for exact pause behavior and mode triggers.

---

## Critical Quality Rules

Non-negotiable. Violating any one means the article has failed:

1. **Read `references/writing-guide.md` BEFORE writing** — pre-writing framework + de-AI protocol are mandatory.
2. **Zero AI-sounding text** — run the full 4-level de-AI pass from writing-guide.md.
3. **H1 title: mobile-first, concise, and front-loaded** — the converter extracts H1 as the WeChat title, so subject + payoff must appear early.
4. **Digest: ≤54 汉字** (120 UTF-8 byte limit).
5. **Word count: 1,500–2,500 字** — sweet spot for completion is 1,500–2,000.
6. **Specificity over abstraction** — every claim grounded in concrete detail.
7. **Depth over polish** — run the Depth Checklist; if thesis is in top-3 Google results, rewrite don't polish.
8. **Obey client `style.yaml` blacklist** (words AND topics). No exceptions.
9. **Playbook overrides writing-guide** when `clients/{client}/playbook.md` exists.
10. **Ask about image scope before Step 6** — use `AskUserQuestion` if available, plain text otherwise.
11. **Always publish to drafts** — Step 7 is mandatory and automatic; do NOT ask.
12. **Ready article means ready article** — if the user already supplied the article and only wants formatting/publish, do NOT reopen topic ideation, KB mining, or full rewriting unless they explicitly ask for it.

---

## Result Links Rule

Always end draft, publish, list, and stats-review actions with `Result links`.

The exact contract lives in [`references/runtime-rules.md`](references/runtime-rules.md).

---

## Pipeline Overview

Two execution lanes:
- **Full pipeline:** Load config → Mine KB → Trending topics → Dedup + SEO → Topic select → Framework select → Write → SEO + de-AI → Generate images → Publish to drafts → Archive → Report with result links
- **Built-in formatting + direct-send capability:** Validate the supplied article → do the minimum WeChat adaptation → publish to drafts → report with result links

Full per-step detail: [`references/pipeline.md`](references/pipeline.md).

**Routing shortcuts:**

- User gave a specific topic → Skip Steps 2–3, go 1.5 → 3.5
- User gave raw Markdown or a finished article for formatting/publish only → run the minimal checks from `content-adaptation-playbook.md`, then jump to Step 7

---

## Resilience: Never Stop on a Single-Step Failure

Every pipeline step has a fallback. If a step AND its fallback both fail, skip that step, note it in the final output, and continue. **Never halt the whole pipeline on a single-step failure.**

See [`references/resilience.md`](references/resilience.md) for the full per-step fallback chain and environmental failure recovery.

---

## Operations

For post-publish commands (polish, rewrite, change theme, stats review), client onboarding, learn-from-edits, custom themes, and first-run setup, read `references/operations.md`.

If the request is about improving this skill itself, refactoring its structure, or checking for documentation drift, read `references/skill-maintenance.md`.

---

## Gotchas — Common Failure Patterns

Six named anti-patterns observed across real dispatches. Call them out by name instead of re-deriving the problem.

- **The AI Essay** — correct, comprehensive, boring; no person behind it
- **The Generic Hot Take** — summary of other summaries; no unique angle
- **The Word-Count Pad** — verbose instead of deep
- **The Pretty But Empty Article** — styling without substance
- **The Blacklist Miss** — forbidden words slip past the final scan
- **The Broken Pipeline Halt** — one step fails, whole run aborts (never do this)

Full explanation, fix, and detection method for each: [`references/gotchas.md`](references/gotchas.md).

## References

- API: [references/openapi-document.md](references/openapi-document.md)
- CLI: [references/cli-reference.md](references/cli-reference.md)
- Publishing: [shared/PUBLISHING.md](shared/PUBLISHING.md)
