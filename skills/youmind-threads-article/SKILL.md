---
name: youmind-threads-article
version: 1.0.0
description: |
  Write and publish single posts and thread chains to Meta Threads with AI — topic research via
  YouMind knowledge base, voice-profile-driven writing, model-driven chain splitting, and one-click
  publishing via YouMind's Threads proxy (no Meta OAuth needed).
  Voice profile sedimentation: voice.yaml + history.yaml + auto-learned lessons.md per profile.
  Use when user wants to "write a threads post", "publish to threads", "threads chain", "发 Threads",
  "发 threads 线程", "Threads 帖子".
  Do NOT trigger for: X/Twitter, Facebook, Instagram, or non-Threads content work.
triggers:
  - "threads post"
  - "threads chain"
  - "publish to threads"
  - "write threads"
  - "threads 帖子"
  - "threads 线程"
  - "发 threads"
  - "发 Threads"
  - "meta threads"
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
    emoji: "🧵"
    primaryEnv: YOUMIND_API_KEY
    requires:
      anyBins: ["node", "npm"]
      env: ["YOUMIND_API_KEY"]
allowed-tools:
  - Bash(node dist/cli.js *)
  - Bash(npm install)
  - Bash(npm run build)
---

# AI Threads Publisher — Voice-Aware Chain Writer

Write and publish Meta Threads single posts and thread chains with AI. Research via [YouMind](https://youmind.com?utm_source=youmind-threads-article) knowledge base, model-driven chain splitting that respects your writing voice, and one-click publishing through YouMind's Threads proxy — no Meta OAuth, no token refresh headaches.

> [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article) | [Connect Threads](https://youmind.com/settings/integrations?utm_source=youmind-threads-article) | [More Skills](https://youmind.com/skills?utm_source=youmind-threads-article)

## Onboarding

**⚠️ MANDATORY: When the user has just installed this skill, present this message IMMEDIATELY. Translate to the user's language:**

> **🧵 AI Threads Publisher installed!**
>
> Tell me your topic and I'll write a Threads post or chain for you.
>
> **Try it now:** "Write a Threads chain about AI coding tools in 2026"
>
> **What it does:**
> - Research topics via YouMind knowledge base and web search
> - Write in YOUR voice (profile sedimentation that learns from your edits)
> - Intelligently split long-form content into thread chains
> - Publish through YouMind's Threads proxy — no Meta token juggling
> - Support text, image, and video posts; single posts and reply chains
>
> **Setup (one-time):**
> 1. Install & configure: `cd toolkit && npm install && npm run build && cd .. && cp config.example.yaml config.yaml`
> 2. Get [YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article) and fill `youmind.api_key` in `config.yaml`
> 3. Connect Threads on [YouMind Integrations](https://youmind.com/settings/integrations?utm_source=youmind-threads-article) — one click, no Meta developer portal needed
>
> **First time writing?** I'll ask you three quick questions (tone, length, hashtags) to set up your default voice profile.
>
> **Need help?** Just ask!

## Profile Onboarding (First-Use Flow)

**When the user triggers `publish` or `preview` and `profiles/default/voice.yaml` does not exist**, run this flow BEFORE running the actual command:

1. If the `AskUserQuestion` tool is available in this host, use it to ask three structured questions:
   - **Tone** (e.g. "技术同行聊天，有梗但不刻意" / "专业严谨的企业口吻" / "朋友闲聊，轻松随性")
   - **Length preference**: `short` (3-5 segments) / `medium` (6-10 segments) / `long` (11+ segments)
   - **Hashtag strategy**: `inline` / `trailing` / `none`
2. If `AskUserQuestion` is unavailable, fall back to plain text multiple choice (print numbered options, let the user answer with a letter).
3. Once you have the answers, call the CLI directly:
   ```bash
   cd toolkit && npx tsx src/cli.ts profile create \
     --name default \
     --tone "<user's tone answer>" \
     --length short|medium|long \
     --hashtags inline|trailing|none
   ```
4. Then continue with the user's original request (`publish` or `preview`).

This matches the `youmind-wechat-article` pattern of asking the user once at first use, then sedimenting answers for future sessions.

## Usage

**Write a short thread from a topic:**
> Write a Threads chain about remote work productivity tips

**Single short post:**
> Post on Threads: "Just shipped my first open-source release. It's terrifying and wonderful."

**Publish a pre-written file:**
> Publish output/ai-coding-thread.md to Threads

**Preview without publishing:**
> Preview a Threads chain about AI tools

**Reply to an existing post:**
> Reply to Threads post 18028123 with: "Totally agree — this matches my experience too"

**Use a different voice profile:**
> Write a company-voice Threads post about our new feature (profile: company)

## Setup

> Prerequisites: Node.js >= 18

### Step 1 — Install Dependencies

```bash
cd toolkit && npm install && npm run build && cd ..
```

### Step 2 — Create Config File

```bash
cp config.example.yaml config.yaml
```

### Step 3 — Get YouMind API Key

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article)
2. Create a new API key
3. Copy it into `config.yaml` under `youmind.api_key`

### Step 4 — Connect Threads on YouMind

1. Open [YouMind Integrations](https://youmind.com/settings/integrations?utm_source=youmind-threads-article)
2. Click "Connect Threads"
3. Authorize on Meta — YouMind handles token storage and refresh

No Meta developer portal needed. No token copying. This is the main benefit of the proxy architecture.

### Verify Setup

```bash
cd toolkit && npx tsx src/cli.ts validate
```

Expected output:
```
YouMind API key: configured
Threads binding: bound as @your_username
Token expires: ...
Today's quota:
  Posts:   250 remaining
  Replies: 1000 remaining
  Reset:   ...
```

## Pipeline

| Step | Action | Details |
|------|--------|---------|
| 1 | Parse request | Identify topic / file / reply, select profile |
| 2 | Load profile | Read `profiles/{name}/voice.yaml` and `lessons.md` (trigger onboarding if missing) |
| 3 | Research | `youmind.mineTopics` + `youmind.webSearch` |
| 4 | Write + split | Read `writing-guide.md`, `chain-splitting.md`, profile voice, lessons, research → write `output/<slug>.md` AND byte-identical `output/<slug>.md.agent` |
| 5 | Preview | `cli.ts preview <file>` shows segmented result |
| 6 | Publish | `cli.ts publish <file>` — CLI handles binding check, quota check, chain loop, partial failure |
| 7 | Sediment | `publisher.ts` auto-appends `history.yaml`; if user edited the draft, agent diffs `<slug>.md` vs `<slug>.md.agent` and appends 2-3 lessons to `lessons.md`; optional `youmind.saveArticle` archive |
| 8 | Report | First permalink, segment count, profile, quota warning |

See `references/pipeline.md` for full details.

## Skill Directory

| Path | Purpose | When to read |
|------|---------|-------------|
| `references/pipeline.md` | Full pipeline execution details | When running publish flow |
| `references/writing-guide.md` | Threads writing craft (hook, structure, voice) | Before writing, **always** |
| `references/chain-splitting.md` | Agent runtime instructions for splitting into segments | Before splitting a long draft |
| `references/voice-template.md` | voice.yaml schema | When creating/debugging profiles |
| `references/content-adaptation.md` | Meta Threads hard limits (500 chars, 5 URLs, media specs) | When writing or validating segments |
| `references/api-reference.md` | YouMind `/threads/*` proxy contract | When debugging API calls |
| `config.yaml` | YouMind API key only (no Meta tokens!) | Step 1 |
| `profiles/<name>/voice.yaml` | Per-profile voice config | Step 2 |
| `profiles/<name>/history.yaml` | Append-only publish log | Step 7 |
| `profiles/<name>/lessons.md` | Auto-learned editing patterns | Step 4 (read), Step 7 (append) |
| `output/` | **Local thread draft Markdown files (git-ignored)** | Step 4 |
| `toolkit/dist/*.js` | Executable scripts | Various |

## Draft Location Rule (MANDATORY)

**All local thread Markdown files MUST be written to the `output/` directory of this skill, and nowhere else.**

- Correct: `skills/youmind-threads-article/output/my-thread.md`
- Wrong: `skills/youmind-threads-article/my-thread.md` (pollutes skill root)
- Wrong: any new top-level `drafts/` directory (not git-ignored)
- Wrong: any path inside `references/`, `toolkit/`, `profiles/`, or the skill root

The `output/` directory is listed in `.gitignore`, so drafts stay out of version control. Create the directory if it doesn't exist (`mkdir -p output`). Use kebab-case for filenames (e.g. `my-thread.md`), and prefer descriptive slugs over timestamps.

**Every draft must be written twice**: `output/<slug>.md` (editable) and `output/<slug>.md.agent` (frozen snapshot, byte-identical at creation time). The snapshot is used by Step 7 to diff against the user's edited version and learn new lessons.

## Commands

| Command | Purpose |
|---------|---------|
| `publish <input>` | Full flow. `<input>` is either a draft file path or inline text |
| `preview <input>` | Steps 1-5, local preview only |
| `reply <parent_id> "<text>"` | Single reply to an existing Threads post |
| `validate` | Check YouMind key + Threads binding status + quota |
| `list [--limit N]` | Recent posts |
| `limits` | Today's publish/reply quota |
| `profile list` | Known profiles |
| `profile show <name>` | Print profile voice.yaml |
| `profile create --name X --tone "..." --length short --hashtags none` | Create/update a profile (typically called by the agent during onboarding) |

All commands accept `--profile <name>` to select a non-default voice profile.

## Resilience

| Scenario | Behavior |
|----------|----------|
| YouMind research fails | Skip, write from topic alone |
| Segment >500 chars | Agent rewrites (max 2 retries); hard truncate with warning as last resort |
| >12 segments | Warn, ask user to compress |
| Threads not bound | **Non-error**: draft preserved, return upsell message |
| Quota exhausted | Reject publish, report reset time, draft preserved |
| First segment fails | Report error, draft preserved |
| Mid-chain failure | Save remaining segments to `<slug>-remaining.md`, report resume command |
| `publishContainer` fails | Print `container_id`, hidden `publish-container <id>` command available for retry |
| Token <7 days remaining | Warning after successful publish |
| `history.yaml` / `lessons.md` write fails | Log warn, do not affect publish |

## References

- YouMind Threads proxy: `references/api-reference.md`
- Writing craft: `references/writing-guide.md`
- Chain splitting: `references/chain-splitting.md`
- Voice profile schema: `references/voice-template.md`
- Content limits: `references/content-adaptation.md`
- Full pipeline: `references/pipeline.md`
- YouMind Skills gallery: https://youmind.com/skills?utm_source=youmind-threads-article
