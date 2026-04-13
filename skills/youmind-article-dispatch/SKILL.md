---
name: youmind-article-dispatch
version: 1.0.0
description: |
  Dispatch content to multiple platforms from a single topic — Dev.to, Hashnode, WordPress,
  Ghost, LinkedIn, X/Twitter, Reddit, Medium, WeChat, Qiita. Each platform skill adapts
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

Distribute your content to multiple platforms from a single topic. Each platform skill independently adapts content for its target audience — developers on Dev.to, professionals on LinkedIn, communities on Reddit, readers on Medium, and more.

> [Get YouMind API Key →](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch) · [More Skills →](https://youmind.com/skills?utm_source=youmind-article-dispatch)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **✅ Content Dispatch Hub installed!**
>
> Tell me a topic and I'll help you publish it across multiple platforms.
>
> **Supported platforms:** Dev.to · Hashnode · WordPress · Ghost · LinkedIn · X/Twitter · Reddit · Medium · WeChat · Qiita
>
> **Try it now:** "Help me write about AI agents and publish to Dev.to and LinkedIn"

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

## Platform Registry

| Platform | Skill | API | Auth | Audience | Best For |
|----------|-------|-----|------|----------|----------|
| Dev.to | `youmind-devto-article` | REST | API Key | Developers, OSS contributors | Technical tutorials, tool reviews, dev experience |
| Hashnode | `youmind-hashnode-article` | GraphQL | PAT | Dev bloggers, tech writers | In-depth technical blogs, series, developer stories |
| WordPress | `youmind-wordpress-article` | REST | App Password | General audiences | Long-form articles, SEO-optimized content |
| Ghost | `youmind-ghost-article` | Admin API | JWT | Publishers, newsletter writers | Editorial content, premium publications |
| LinkedIn | `youmind-linkedin-article` | Posts API | OAuth 2.0 | Professionals, B2B | Thought leadership, industry insights, career advice |
| X/Twitter | `youmind-x-article` | API v2 | OAuth 2.0 | General, viral audiences | Hot takes, threads, breaking news commentary |
| Reddit | `youmind-reddit-article` | REST | OAuth 2.0 | Niche communities | Community discussions, AMAs, experience sharing |
| Medium | `youmind-medium-article` | REST | Token | General readers, writers | Narrative essays, thought leadership, personal stories |
| WeChat | `youmind-wechat-article` | REST | AppID/Secret | Chinese audiences | Styled long-form articles, official account content |
| Qiita | `youmind-qiita-article` | REST v2 | Bearer Token | Japanese developers | Technical articles, tutorials, knowledge sharing |

> **Note:** Each platform skill must be installed separately. Dispatch will check which skills are available before proceeding.

## Dispatch Pipeline

### Step 1: Parse Request
- Extract topic/brief from user input
- Identify target platforms (explicit list, "all", or ask user to choose)
- Check which platform skills are actually installed:
  ```
  ls skills/ | grep youmind-.*-article
  ```
- If a requested platform skill is not installed, warn the user and skip it

### Step 2: Generate Content Brief
Create a standardized brief to pass to each platform skill (see `references/content-brief-format.md`):

```yaml
topic: "The core topic sentence"
angle: "The specific angle or atomic insight"
keywords: ["keyword1", "keyword2", "keyword3"]
tone: "professional"  # or casual, technical, conversational
language: "en"        # or zh, ja, etc.
source_material: []   # from YouMind knowledge mining (if available)
constraints: {}       # any user-specified constraints
```

**YouMind knowledge mining:** If the user has a YouMind API key configured in any platform skill's config, run `mine-topics` ONCE and include the results in the brief. This avoids redundant YouMind calls across platform skills.

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
| Reddit | ⚠️ Draft | "AI Agents - My Experience" | (draft, not yet submitted) |
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
| `references/content-brief-format.md` | Standardized content brief format specification |
