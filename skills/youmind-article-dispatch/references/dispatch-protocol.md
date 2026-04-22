# Dispatch Protocol

## Overview

The dispatch protocol defines how the dispatch skill orchestrates content distribution across multiple platforms. It handles three modes: single-platform routing, multi-platform dispatch, and all-platform broadcast.

## Step-by-Step Protocol

### 1. Request Parsing

Parse the user's input to extract:

```
Input: "Write about AI agents and publish to Dev.to, Ghost, and X"

Parsed:
  topic: "AI agents"
  platforms: ["devto", "ghost", "x"]
  mode: "multi"
```

**Platform name resolution:**

| User says | Resolves to | Skill |
|-----------|-------------|-------|
| dev.to, devto, dev | devto | youmind-devto-article |
| hashnode | hashnode | youmind-hashnode-article |
| wordpress, wp | wordpress | youmind-wordpress-article |
| tumblr | tumblr | youmind-tumblr-article |
| ghost | ghost | youmind-ghost-article |
| beehiiv | beehiiv | youmind-beehiiv-article |
| kit, convertkit | kit | youmind-kit-article |
| x, twitter | x | youmind-x-article |
| all, everywhere, 全部 | ALL | all active roster platforms |
| wechat, 微信, 公众号 | wechat | youmind-wechat-article |
| qiita | qiita | youmind-qiita-article |
| all, everywhere, 全部 | ALL | all installed skills |

### 2. Skill Availability Check

Before dispatching, verify which platform skills are installed:
- Check the `skills/` directory for `youmind-{platform}-article/` directories
- If a requested skill is missing, warn the user and offer to skip

### 3. Author Profile Loading + Content Brief Generation

**3a. Load author profile:**
```
if file_exists("~/.youmind/author-profile.yaml"):
  authorProfile = load("~/.youmind/author-profile.yaml")
else if file_exists("skills/youmind-article-dispatch/author-profile.yaml"):
  authorProfile = load("skills/youmind-article-dispatch/author-profile.yaml")  # legacy migration path
else:
  authorProfile = null  # dispatch works without it
```

**3b. Generate content brief:**
1. Extract topic and angle from user input
2. If YouMind API is available, run `mine-topics` ONCE to gather knowledge base material
3. Ask user for any constraints (tone, language, length preferences)
4. If the target includes Beehiiv or Kit, optionally attach newsletter hints under `constraints.newsletter` (`visibility`, `subject_hint`, `preview_text_hint`, `template_preference`, `audience_mode`)
5. Package into the standard brief format (see `content-brief-format.md`)

**3c. Resolve author profile per platform:**
For each target platform:
1. Load the platform's DNA (from the platform skill's `references/platform-dna.md`)
2. Merge author profile with platform DNA using `content-adaptation-matrix.md` rules
3. Output a **resolved per-platform profile** (not the raw author file)
4. Attach to the content brief as `resolved_author`
5. If depth mismatch detected → trigger mandatory outline adaptation (not just warning)

```
for each platform in target_platforms:
  resolved = resolveProfileForPlatform(authorProfile, platformDNA[platform], platform)
  briefs[platform] = {
    ...baseBrief,
    resolved_author: resolved.profile,
    warnings: resolved.warnings
  }
  if resolved.warnings.length > 0:
    surface warnings to user BEFORE dispatch
```

### 4. Platform Dispatch

**Sequential dispatch (default):**
```
for each platform in target_platforms:
  1. Load platform skill's SKILL.md
  2. Pass content brief as context
  3. Follow platform skill's pipeline
  4. Record result (status, URL, result_links, title)
  5. Report progress to user
```

**Parallel dispatch (with subagents):**
```
spawn subagent for each platform:
  1. Each subagent loads its platform skill's SKILL.md
  2. Each works independently with the content brief
  3. Collect all results when complete
```

### 5. Result Collection and Reporting

Present final summary table with:
- Platform name and status icon (✅ published, ⚠️ draft, ❌ failed, ⏭️ skipped)
- Final title (may differ per platform due to adaptation)
- URL or link to published content
- Result links for follow-up actions (post page / dashboard / stats entry)
- Any errors or warnings

## Error Handling

| Scenario | Action |
|----------|--------|
| Platform skill not installed | Skip, suggest installation |
| Platform config not set up | Skip, provide setup instructions |
| API error during publish | Report error, continue with other platforms |
| Rate limit hit | Wait and retry once, then report as failed |
| Content too long for platform | Platform skill's content-adapter handles truncation |

## Examples

### Single Platform
```
User: "Write a technical tutorial about Docker for Dev.to"
Dispatch: Invoke youmind-devto-article with topic "Docker tutorial"
Result: Article published/drafted on Dev.to
```

### Multi-Platform
```
User: "Publish about AI coding assistants on Dev.to, Beehiiv, and X"
Dispatch:
  1. Generate brief: topic="AI coding assistants"
  2. Mine YouMind knowledge (once)
  3. Invoke youmind-devto-article → technical tutorial format
  4. Invoke youmind-beehiiv-article → newsletter long-form format
  5. Invoke youmind-x-article → tweet thread format
  6. Report: 3 platforms dispatched, show results table
```

### All-Platform Broadcast
```
User: "全平台发布：大模型 Agent 的实践经验"
Dispatch:
  1. Check installed skills → found 5 installed platform skills
  2. Generate brief, mine YouMind
  3. Dispatch to all 5 installed platform skills
  4. Report results for each
```
