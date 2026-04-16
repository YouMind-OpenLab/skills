---
name: youmind-article-dispatch
version: 1.0.0
description: |
  Dispatch content to multiple platforms from a single topic — Dev.to, Hashnode, WordPress,
  Ghost, LinkedIn, X/Twitter, WeChat, Qiita. Each platform skill adapts
  content independently for its audience and format. Pure orchestration, no publishing logic.
  Integrates YouMind knowledge base for topic research and content material mining.
  Use when user wants to "publish everywhere", "cross-post", "multi-platform publish",
  "dispatch article", "post to all platforms", "distribute content".
  Do NOT trigger for: single-platform requests (route to specific skill), non-content tasks.
triggers:
  - "publish everywhere"
  - "cross-post"
  - "multi-platform"
  - "dispatch article"
  - "post to all platforms"
  - "distribute content"
  - "publish to multiple"
  - "content dispatch"
  - "全平台发布"
  - "多平台分发"
  - "一键发布"
  - "内容分发"
  - "全平台推送"
  - "跨平台发布"
  - "批量发布"
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
    emoji: "🚀"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["node", "npm"]
      env: []
allowed-tools:
  - Bash(node *)
  - Bash(npm *)
  - Bash(ls *)
---

# Content Dispatch Hub — One Topic, Every Platform

Distribute your content to multiple platforms from a single topic. Each platform skill independently adapts content for its target audience — developers on Dev.to, professionals on LinkedIn, readers on Ghost, and more.

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch) · [More Skills →](https://youmind.com/skills?utm_source=youmind-article-dispatch)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, run the onboarding flow IMMEDIATELY. Translate to the user's language.**

The onboarding flow sets up TWO things in ONE conversation: **platform roster** (where to publish) and **author DNA** (how to write). These are NOT separate steps — they happen together during the first dispatch.

### Phase 1: Platform roster (30 seconds)

> **✅ Content Dispatch Hub installed!**
>
> Quick setup — which platforms do you use?
>
> 1. Dev.to  2. Hashnode  3. WordPress  4. Ghost
> 5. LinkedIn  6. X/Twitter  7. WeChat (公众号)  8. Qiita
>
> (list numbers, e.g. "1, 2, 6")

After user selects:
1. Save to `dispatch-roster.yaml` → `active_platforms`
2. For each selected, check skill installed + YouMind connection via `validate`
3. Report status table (✅ connected / ❌ → setup link)

### Phase 2: Author DNA bootstrap (integrated into first dispatch)

**Do NOT ask the user to fill a profile form.** Instead, bootstrap the author profile from one of two paths:

**Path A — User has articles in YouMind KB (preferred):**
1. Call YouMind search API to fetch the user's recent 10–15 articles
2. Analyze across articles: avg paragraph length, code density, language distribution, opening patterns, depth level, typical word count, tone markers
3. Propose a profile:

> 📝 **I analyzed your recent articles. Here's what I see:**
>
> - **Voice:** Conversational-technical, first-person practitioner
> - **Audience:** Mid-level developers (you assume REST/Git knowledge)
> - **Code density:** High (avg 4 code blocks per article)
> - **Depth:** Practitioner-level (how-to with real gotchas, not beginner intros)
> - **Languages:** English primary, Chinese secondary
> - **Signature moves:** You always lead with the problem, include a gotchas section, and end with working code
>
> **Sound right?** I'll use this as your baseline across all platforms. You can adjust anytime.

4. User confirms/adjusts → save to `author-profile.yaml`
5. Immediately proceed to first dispatch with the profile active

**Path B — New user, no articles (cold start):**
Embed 3 targeted questions INTO the first dispatch request, not as a separate quiz:

> You said: "帮我写一篇关于 AI agents 的文章发到 Dev.to 和 X"
>
> Great! Since this is your first dispatch, 3 quick questions so I write in YOUR voice:
>
> **1. 这篇文章的风格？**
> (a) 代码先行，先看效果再讲原理
> (b) 故事驱动，用经历带出技术点
> (c) 数据说话，benchmark 和对比为主
> (d) 手把手教学，假设读者是入门者
>
> **2. 你的读者是谁？**
> (a) 做产品的开发者
> (b) 正在学习的学生/新人
> (c) 做技术决策的 TL/架构师
> (d) 泛科技读者
>
> **3. 你的内容里绝对不要出现什么？**
> (自由回答 — 例如"不要营销话术"、"不要 AI 味"、"不要太长")

After user answers:
1. Map answers to `author-profile.yaml` fields
2. Save profile
3. **Immediately continue the dispatch** — no second round-trip. The first article is generated WITH the profile already active.
4. After publishing, confirm: "Saved as your writing profile. Next time just say '帮我分发', I know your style."

### Why this matters

| Approach | First article quality | User friction |
|----------|:--------------------:|:-------------:|
| ❌ No profiling | Generic, platform-default | Zero (but bad output) |
| ❌ Separate 5-question form | Better, but profile ≠ real usage | High (feels like homework) |
| ✅ Path A: KB bootstrap | Excellent — based on real writing | Near-zero (confirm/adjust) |
| ✅ Path B: 3 inline questions | Good — targeted baseline | Low (embedded in first dispatch) |

### Roster + Profile updates after onboarding

> "Add Ghost to my platforms" → update `dispatch-roster.yaml`
> "Remove LinkedIn" → update roster
> "I want to write more beginner content" → update `author-profile.yaml`
> "Analyze my recent articles again" → re-run Path A bootstrap

## Usage Modes

### Mode 1: Single Platform Routing
User specifies one platform → dispatch directly invokes the corresponding platform skill.

```
"Write about AI agents for Dev.to"         → invoke youmind-devto-article
"Post about startup culture on LinkedIn"   → invoke youmind-linkedin-article
"发布一篇技术文章到 WordPress"                → invoke youmind-wordpress-article
```

### Mode 2: Multi-Platform Dispatch
User specifies multiple platforms → dispatch invokes each platform skill sequentially with the same topic.

```
"Write about AI agents and publish to Dev.to, LinkedIn, and X"
"把这个话题发布到 Dev.to 和 Hashnode"
```

### Mode 3: All-Platform Broadcast
User wants maximum reach → dispatch to all installed platform skills.

```
"Publish everywhere about the future of AI coding"
"全平台发布：AI 编程的未来"
```

## Platform Skills Are Independent

Each `youmind-{platform}-article` skill is **independently installed, independently published, and fully self-contained**. They work without this dispatch hub. Dispatch is an **optional orchestration layer** — not a dependency, not a framework that platform skills must fit into.

### How dispatch connects to platform skills (when both are installed)

- **Discovery, not coupling.** Dispatch scans for installed `youmind-*-article` skills at runtime. It optionally reads a small `dispatch-capabilities.yaml` at each skill's root to learn what operations that skill supports (generate, adapt, condense, translate, etc.) and its hard limits. If a platform skill does not ship this file, dispatch falls back to sensible defaults and still invokes it normally.
- **Brief is an optional extra, not a requirement.** When dispatch invokes a platform skill, it passes a content brief (topic, angle, keywords, optional `resolved_author` block). Platform skills that understand these fields use them as richer context; skills that don't simply ignore the extras and work as usual.
- **Author profile lives in the user's home directory, not in this skill.** Both this hub and platform skills read `~/.youmind/author-profile.yaml` — the canonical shared location defined in [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md). Uninstalling dispatch does not remove the profile; platform skills continue to work standalone with full DNA support.
- **Results flow back as a standardized shape** (status, URL, title, conformance_report) so dispatch can aggregate multi-platform runs. Each platform skill publishes this same result shape regardless of whether dispatch is present — it's a clean output API, not a contract with dispatch.

### Zero coupling obligations for platform skills

- Platform skills do NOT import from dispatch.
- Platform skills do NOT require dispatch to be installed.
- Platform skills do NOT break if dispatch is uninstalled.
- Platform skills do NOT need to be updated when dispatch changes.
- `dispatch-capabilities.yaml` is **opt-in metadata** that lets dispatch route more intelligently. Removing it reverts to defaults; it never breaks the platform skill.

The optional integration protocol is documented at [`/shared/DISPATCH_CONTRACT.md`](/shared/DISPATCH_CONTRACT.md) (v1.0). Platform skills that want richer dispatch integration may follow it; those that don't, don't.

## Platform Registry

| Platform | Skill | Audience | Best For |
|----------|-------|----------|----------|
| Dev.to | `youmind-devto-article` | Developers, OSS contributors | Technical tutorials, tool reviews, dev experience |
| Hashnode | `youmind-hashnode-article` | Dev bloggers, tech writers | In-depth technical blogs, series, developer stories |
| WordPress | `youmind-wordpress-article` | General audiences | Long-form articles, SEO-optimized content |
| Ghost | `youmind-ghost-article` | Publishers, newsletter writers | Editorial content, premium publications |
| LinkedIn | `youmind-linkedin-article` | Professionals, B2B | Thought leadership, industry insights, career advice |
| X/Twitter | `youmind-x-article` | General, viral audiences | Hot takes, threads, breaking news commentary |
| WeChat | `youmind-wechat-article` | Chinese audiences | Styled long-form articles, official account content |
| Qiita | `youmind-qiita-article` | Japanese developers | Technical articles, tutorials, knowledge sharing |

> **Auth:** All 8 platforms use YouMind OpenAPI. You need only a `youmind.api_key` — platform credentials are stored encrypted in [YouMind Connector Settings](https://youmind.com/settings/connector). No local platform keys.
>
> **Note:** Each platform skill must be installed separately. Dispatch checks your roster (`dispatch-roster.yaml`) on each run.

## Dispatch Pipeline

### Step 1: Parse Request + Load Roster
- Extract topic/brief from user input
- Load `dispatch-roster.yaml` for the user's active platform list
- Resolve target platforms:
  - User says "帮我分发" / "publish everywhere" → use `active_platforms` from roster
  - User specifies platforms explicitly → use those (even if not in roster)
  - No roster exists → ask user which platforms (triggers onboarding)
- For each target platform: verify skill installed + connection status from roster
- Skip platforms that are not installed or not connected (with clear message + setup link)

### Step 2: Load Author Profile + Generate Content Brief

**2a — Load author profile** (if exists):
Read `~/.youmind/author-profile.yaml` (canonical shared location — see `/shared/YOUMIND_HOME.md`). This file captures the user's cross-platform writing DNA — voice, audience, content preferences, and per-platform overrides. See `references/author-profile-spec.md` for format. Fallback: if the `~/.youmind/` path is missing but `skills/youmind-article-dispatch/author-profile.yaml` exists (legacy), offer to migrate.

If no profile exists → skip this step; dispatch works without it (just less personalized). After the first successful dispatch, offer to help the user build one.

**2b — Generate content brief** (see `references/content-brief-format.md`):

```yaml
topic: "The core topic sentence"
angle: "The specific angle or atomic insight"
keywords: ["keyword1", "keyword2", "keyword3"]
language: "en"        # or zh, ja, etc.
source_material: []   # from YouMind knowledge mining (if available)
resolved_author: {}   # per-platform resolved profile (computed in Step 3)
constraints: {}       # any user-specified constraints
```

**YouMind knowledge mining:** If the user has a YouMind API key configured in any platform skill's config, run `mine-topics` ONCE and include the results in the brief. This avoids redundant YouMind calls across platform skills.

**2c — Resolve author profile per platform:**
For EACH target platform, merge the author profile with that platform's DNA using the rules in `references/content-adaptation-matrix.md`. This produces a **resolved per-platform profile** — NOT the raw author file. Each platform skill receives only the resolved, relevant fields for its platform. This prevents raw-profile leakage and irrelevant context bleed.

If a depth mismatch is detected (e.g., author targets "expert" but platform audience is "general"), the merge triggers a mandatory outline adaptation step — not just a warning. See matrix Priority 5.

### Step 3: Dispatch to Platform Skills
For each target platform, invoke the platform skill with the content brief as context.

**Sequential mode (default):** Run each platform skill one at a time. The agent reads each skill's SKILL.md and follows its pipeline, passing the content brief as the initial topic/context.

**Parallel mode (if subagents available):** Spawn one subagent per platform. Each subagent independently runs its platform skill's full pipeline. Use this when the agent platform supports parallel subagents.

**MANDATORY: Pass the content brief to each platform skill.** When invoking a platform skill, include:
1. The topic and angle from the brief
2. Any YouMind knowledge context already mined
3. The instruction to adapt content for that specific platform's audience

### Step 4: Collect Results
Gather results from all platform dispatches:

| Field | Description |
|-------|-------------|
| platform | Platform name |
| status | `published` / `draft` / `failed` / `skipped` |
| url | URL of published content (if available) |
| title | Final title used |
| error | Error message (if failed) |

### Step 5: Summary Report
Present a summary table to the user:

```
## Dispatch Results

| Platform | Status | Title | URL |
|----------|--------|-------|-----|
| Dev.to | ✅ Published | "AI Agents: A Practical Guide" | https://dev.to/... |
| LinkedIn | ✅ Published | "Why AI Agents Matter for..." | https://linkedin.com/... |
| X/Twitter | ✅ Thread posted | "🧵 AI Agents are changing..." | https://x.com/... |
```

## Resilience Rules

| Rule | Description |
|------|-------------|
| **Isolate failures** | One platform failing MUST NOT stop other platforms. Report partial results. |
| **Progress updates** | After each platform completes, show a brief status update to the user. |
| **Missing skills** | If a requested platform skill is not installed, skip it with a clear message. |
| **Config missing** | If a platform skill's config is not set up, skip it and suggest setup instructions. |
| **Fallback to draft** | When in doubt, create as draft rather than publishing directly. |

## References

| File | Purpose |
|------|---------|
| `references/platform-registry.md` | Detailed platform capabilities, audience profiles, and constraints |
| `references/dispatch-protocol.md` | Step-by-step dispatch workflow with examples |
| `references/content-brief-format.md` | Standardized content brief format specification (v2: includes resolved author profile) |
| `references/author-profile-spec.md` | Author profile format, cold-start guide, evolution strategy |
| `references/content-adaptation-matrix.md` | How author DNA × platform DNA merge (priority rules, merge algorithm) |
| `references/profile-learning.md` | How author DNA accumulates from usage (5 learning sources, diff analysis, cadence) |
| [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md) | **User-home directory convention** (`~/.youmind/` — shared across ALL YouMind skills) |
| [`/shared/DISPATCH_CONTRACT.md`](/shared/DISPATCH_CONTRACT.md) | **Optional** interop protocol between this hub and platform skills (v1.0) |
| `skills/youmind-{platform}-article/dispatch-capabilities.yaml` | Per-platform capability manifest (dispatch reads dynamically) |
| `author-profile.example.yaml` | Example author profile — copy to `author-profile.yaml` and customize |
