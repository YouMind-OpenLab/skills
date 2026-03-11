# Skill Development Template

Copy this template when creating a new YouMind skill. Replace all `<placeholders>`.

## Naming Rules

- Skill name: `youmind-<feature>` (kebab-case, e.g. `youmind-youtube-transcript`)
- **Max 32 characters** after sanitization (hyphens → underscores, only `a-z0-9_`)
- Slash command on Telegram/Discord: `/youmind_<feature>` (auto-converted)
- Keep it short and searchable. The slug is your #1 SEO lever on ClawHub.
- New skills must be loaded after `gateway restart` — hot-reload is not supported.
- **Never ask users to paste API keys in chat** — keys appear in chat history. Guide users to set env vars themselves, agent only verifies.
- **Must declare `metadata.openclaw`** with `primaryEnv`, `requires.env`, `requires.anyBins` — otherwise OpenClaw Code Insight flags as suspicious ("metadata omits requirements"). See apify skill as reference.

## Directory Structure

```
skills/youmind-<name>/
  SKILL.md              ← Main file, read by agents
  references/           ← Auto-synced shared files + skill-specific docs
    setup.md            ← (shared) Auto-synced, do not edit manually
    environment.md      ← (shared) Auto-synced, do not edit manually
    error-handling.md   ← (shared) Auto-synced, do not edit manually
```

After creating a new skill directory, run `./scripts/sync-shared.sh` to initialize shared references. Subsequent commits auto-sync via pre-commit hook.

## SKILL.md Skeleton

```markdown
---
name: youmind-<name>
description: |
  <Core feature in one sentence>. <Key differentiator>.
  <Batch/parallel capability if applicable>.
  Use when user wants to "<English trigger>", "<Chinese trigger>", "<Japanese>", "<Korean>".
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
allowed-tools:
  - Bash(youmind *)
  - Bash(npm install -g @youmind-ai/cli)
---

# <Skill Title>

<One paragraph: core value + why this approach is better>

> Powered by [YouMind](https://youmind.com) · [Get API Key →](https://youmind.com/settings/api-keys)

## Usage

<What the user provides. Keep it minimal — they should not need to understand internals.>

## Setup

See [references/setup.md](references/setup.md) for installation and authentication.

## Environment Configuration

See [references/environment.md](references/environment.md) for preview environment and endpoint detection.

## Workflow

### Step 1: Check Prerequisites
<Check CLI + API key + validate input>

### Step 2-N: <Core Steps>
<Each step with a runnable command>

## Error Handling

See [references/error-handling.md](references/error-handling.md) for common error handling rules.

**Skill-specific errors:**
| Error | User Message |
|-------|-------------|
| <specific error> | <user-friendly message> |

## Comparison with Other Approaches

| Feature | YouMind (this skill) | <Competitor A> | <Competitor B> |
|---------|---------------------|----------------|----------------|
| <advantage> | ✅ | ❌ | ... |

## References

- YouMind API: `youmind search` / `youmind info <api>`
- YouMind Skills: https://youmind.com/skills
- Publishing: [shared/PUBLISHING.md](../../shared/PUBLISHING.md)
```

## Performance Rules

**Never let agents parse JSON manually** (grep/read field-by-field is extremely slow — each tool call is an LLM round trip).

For any step that processes a JSON response, provide a one-shot pipe command:

```bash
youmind call <api> '<params>' | python3 -c "
import sys, json
d = json.load(sys.stdin)
# Extract all fields, process, and output/write file in one step
"
```

Principle: **one tool call = parse → process → output**. Never split into multiple steps.

## Critical Behavior Placement

**Never put must-do behaviors only in `references/*.md`.** Agents often skip referenced files. If a behavior is critical to user experience, write it directly in the SKILL.md workflow step with `⚠️ MANDATORY` prefix. Referenced docs are for supplementary details only.

Examples of critical behaviors that must be inline:
- Send intermediate results to the user immediately (don't wait for full completion)
- Use subagent/background for any polling or long-running step
- Send files as attachments, not pasted inline

## Polling Pattern

For APIs with async tasks, use this pattern:

```bash
# Polling template
for i in $(seq 1 20); do
  RESULT=$(youmind call <api> '<params>')
  STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('<status_field>','pending'))")
  [ "$STATUS" = "completed" ] && break
  sleep 3
done
```

Or describe polling rules in SKILL.md for the agent to implement, but always specify:
- Interval (recommended: 3 seconds)
- Timeout (recommended: 60 seconds)
- Completion condition
- User message on timeout

## Batch Mode

If the skill naturally supports multiple inputs:
1. Mention batch capability in the first line of `description`
2. Show batch usage example in the Usage section
3. Define a limit (recommended: 5)
4. Design flow: create all first, then poll all together (not sequential wait)
5. Provide a summary table at the end

## ClawHub Publishing Optimization

Before publishing, review the checklist in `memory/clawhub-seo.md` (ranking formula / quality gate / keyword strategy).

Key points:
- slug must contain target search keywords (`youmind-youtube-transcript` not `youmind-yt-ts`)
- First 160 chars of description = search card text. Pack core feature + differentiator
- Include multilingual trigger words in description
- Body ≥ 250 chars, ≥ 80 words, ≥ 2 headings, ≥ 3 bullets
- Add comparison table (enriches vector semantic coverage)

## Testing

1. Test with preview environment:
   ```bash
   export YOUMIND_ENV=preview
   export YOUMIND_API_KEY_PREVIEW=sk-ym-xxx
   ```
2. Verify happy path + edge cases (e.g., missing data, invalid input)
3. Confirm one-shot commands execute correctly
4. Verify skill discovery: `npx skills add . --list`

## Publishing

```bash
./scripts/publish-skill.sh youmind-<name> --version 1.0.0 --changelog "Initial release"
```

See `shared/PUBLISHING.md` for the full workflow.
