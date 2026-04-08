# YouMind Threads Article Skill

## Problem

There are 10 YouMind article skills covering WeChat, Facebook, Instagram, LinkedIn, X, Ghost, Dev.to, Hashnode, WordPress, and Qiita — but none for Threads. Threads is a growing Meta platform with a unique content shape: short (≤500 chars), conversation-first, thread-chain native. It cannot be served well by adapting the X or Facebook skill.

Two secondary problems this skill also solves:

1. **OAuth friction kills adoption.** Every existing article skill forces the user to manually click through Meta/LinkedIn/X developer portals to get a long-lived token. Token refresh every 60 days is a recurring pain. A platform-level OAuth binding on YouMind would let the skill require only `youmind.api_key`.
2. **Voice consistency is fragile.** Users want their personal writing style applied across threads, but existing skills re-derive voice each time from scratch. A lightweight sinking mechanism (profile + history + lessons) lets the skill learn across sessions.

## Goals

- Publish single posts and thread chains to Threads via YouMind as a proxy (skill holds no Threads token)
- Support TEXT, IMAGE, VIDEO media types
- Support reply to existing posts
- Model-driven thread splitting (no hard-coded algorithm) based on per-profile voice rules
- Sinking mechanism: voice profiles, publish history, auto-learned lessons
- Local writing and preview work without a Threads binding; binding is only required at publish time (upsell at the conversion moment)
- Follow the existing `youmind-*-article` skill template so users have no learning curve

## Non-goals

- Carousel posts (2-20 items) — deferred to v1.1
- Implementing the YouMind-side OAuth binding and `/threads/*` endpoints — out of scope for this skill; this spec only defines the interface the skill expects
- Analytics dashboards or engagement tracking beyond a simple history append
- Direct Meta Graph API calls — the skill MUST NOT talk to `graph.threads.net` directly

## Architecture

### Trust boundary

```
Skill (holds: youmind.api_key only)
    │
    ▼
YouMind Server (holds: user's long-lived Threads token, auto-refresh)
    │
    ▼
Meta Threads API (graph.threads.net/v1.0)
```

The skill has **zero** knowledge of Meta tokens, OAuth flow, or refresh. All Threads operations go through YouMind platform endpoints.

### Meta platform support confirmation

Meta supports this delegation pattern at the platform level. Threads API uses standard OAuth 2.0 Authorization Code flow with app-scoped + user-scoped tokens. Long-lived tokens (60 days) are indefinitely refreshable before expiry. This is the same pattern Buffer, Hootsuite, and Later use. YouMind registers as a Meta app with the Threads API use case enabled and stores per-user tokens server-side.

### Assumed YouMind endpoints

The skill assumes these endpoints on `https://youmind.com/openapi/v1` (auth via `x-api-key` header, consistent with existing `/search`, `/webSearch`, etc.):

| Endpoint | Body | Returns |
|---|---|---|
| `POST /threads/status` | `{}` | `{ bound: boolean, username?: string, expires_at?: string }` |
| `POST /threads/createContainer` | `{ text, media_type, image_url?, video_url?, reply_to_id? }` | `{ container_id }` |
| `POST /threads/publishContainer` | `{ container_id }` | `{ id, permalink }` |
| `POST /threads/listPosts` | `{ limit }` | `{ data: ThreadsPost[] }` |

If YouMind later adopts different field names, only `threads-api.ts` needs updating.

### Module layers

```
cli.ts                      (commands, IO, error display)
  │
  ├── publisher.ts          (orchestration, binding gate, chain publishing loop)
  │     ├── threads-api.ts  (wraps YouMind /threads/* endpoints)
  │     └── profile-manager.ts  (load/save voice.yaml, history.yaml, lessons.md)
  │
  ├── content-adapter.ts    (text cleanup, char validation, hashtag application)
  │
  └── youmind-api.ts        (shared YouMind client — copied from facebook skill)
```

**Boundary rule**: `cli.ts` never imports `youmind-api.ts` directly. `publisher.ts` never makes HTTP calls. `threads-api.ts` never applies business rules. `content-adapter.ts` never talks to the network.

## File Layout

```
skills/youmind-threads-article/
├── SKILL.md                    Skill manifest, onboarding, pipeline summary, agent instructions for splitting
├── README.md                   English user docs
├── README_CN.md                Chinese user docs
├── .gitignore                  Ignores output/, config.yaml, dist/, node_modules/, profiles/*/ (but NOT profiles/_index.json)
├── .clawhubignore              Ignores dist/, node_modules/ on publish
├── config.example.yaml         Contains only youmind.api_key + base_url
├── output/                     (runtime, git-ignored)  Local thread .md drafts + .agent originals
├── profiles/
│   ├── _index.json             Committed: empty array marker so the directory exists in the repo
│   └── default/                (runtime, git-ignored — created on first onboarding)
│       ├── voice.yaml          Tone, persona, POV, chain preferences, hashtag strategy
│       ├── history.yaml        Append-only publish log with permalinks
│       └── lessons.md          Auto-generated patterns learned from user edits
├── references/
│   ├── pipeline.md             Step-by-step flow + routing shortcuts
│   ├── writing-guide.md        Threads writing craft: hook, arc, 500-char discipline, voice
│   ├── chain-splitting.md      Agent runtime instructions for splitting a draft into segments
│   ├── voice-template.md       voice.yaml field reference
│   ├── content-adaptation.md   500-char hard constraint, markdown cleanup rules
│   └── api-reference.md        Assumed YouMind /threads/* endpoint contract
└── toolkit/
    ├── package.json            Deps: commander, yaml
    ├── tsconfig.json
    └── src/
        ├── cli.ts
        ├── publisher.ts
        ├── content-adapter.ts
        ├── profile-manager.ts
        ├── threads-api.ts
        └── youmind-api.ts      Copied verbatim from youmind-facebook-article
```

## Module Interfaces

### `threads-api.ts`

```ts
export interface ThreadsConfig { apiKey: string; baseUrl: string; }

export interface BindingStatus {
  bound: boolean;
  username?: string;
  expires_at?: string;  // ISO 8601; used to warn user when <7 days remain
}

export interface ThreadsPost {
  id: string;
  permalink: string;
  text?: string;
  created_time?: string;
}

export interface CreateContainerInput {
  text: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  imageUrl?: string;
  videoUrl?: string;
  replyToId?: string;
}

export function loadThreadsConfig(): ThreadsConfig;
export async function getBindingStatus(cfg: ThreadsConfig): Promise<BindingStatus>;
export async function createContainer(cfg: ThreadsConfig, input: CreateContainerInput): Promise<{ container_id: string }>;
export async function publishContainer(cfg: ThreadsConfig, containerId: string): Promise<{ id: string; permalink: string }>;
export async function listPosts(cfg: ThreadsConfig, limit: number): Promise<{ data: ThreadsPost[] }>;
```

### `content-adapter.ts`

```ts
/** Remove markdown/HTML markup, collapse whitespace. No splitting logic. */
export function cleanText(raw: string): string;

/** Validate a single segment against Threads constraints. */
export function validateSegment(text: string): { ok: boolean; error?: string };

/** Apply a profile's hashtag strategy to final segment text. */
export function appendHashtags(
  text: string,
  hashtags: string[],
  strategy: 'inline' | 'trailing' | 'none',
): string;
```

### `profile-manager.ts`

```ts
export interface VoiceProfile {
  name: string;
  created_at: string;
  tone: string;
  persona: string;
  pov: string;
  chain: {
    length_preference: 'short' | 'medium' | 'long';
    hook_style: string;
    payoff_required: boolean;
  };
  hashtags: {
    strategy: 'inline' | 'trailing' | 'none';
    max_count: number;
  };
  reference_threads: string[];
  blacklist_words: string[];
}

export interface HistoryEntry {
  date: string;
  topic: string;
  segments: number;
  char_total: number;
  posts: Array<{ index: number; id: string; permalink: string }>;
  stats: null | { likes?: number; reposts?: number; replies?: number };
}

export function listProfiles(): string[];
export function loadProfile(name: string): VoiceProfile | null;
export function saveProfile(profile: VoiceProfile): void;
export function appendHistory(profileName: string, entry: HistoryEntry): void;
export function loadLessons(profileName: string): string;
export function appendLessons(profileName: string, markdown: string): void;
```

### `publisher.ts`

```ts
export interface ThreadsSegment {
  text: string;
  index: number;
  total: number;
}

export interface PublishRequest {
  segments: ThreadsSegment[];
  profileName: string;
  imageUrl?: string;    // attached to segment 1 only
  videoUrl?: string;    // attached to segment 1 only
  replyToExisting?: string;  // start chain as reply to this post ID
  topic?: string;       // for history entry
}

export interface PublishResult {
  bound: boolean;
  posts?: Array<{ index: number; id: string; permalink: string }>;
  draftSavedTo?: string;
  upsellMessage?: string;
  partialFailure?: { publishedCount: number; remainingDraftPath: string };
}

export async function publish(req: PublishRequest): Promise<PublishResult>;
```

## Voice Sinking Mechanism

### First-use onboarding

When `profiles/default/voice.yaml` does not exist and the user triggers `publish` or `preview`, the skill runs an onboarding flow:

1. If the host supports `AskUserQuestion`, use it for structured multi-choice
2. Otherwise, fall back to plain text multi-choice (agent prints numbered options, user replies with letter)
3. Ask 3 questions: overall tone, chain length preference, hashtag strategy
4. Write the result to `profiles/default/voice.yaml`
5. Continue with the user's original request

This is the same pattern `youmind-wechat-article` uses for client onboarding.

### `voice.yaml` example

```yaml
name: "default"
created_at: "2026-04-08"

tone: "技术同行聊天：有梗但不刻意，敢吐槽但不酸，用行内缩写但会给必要解释"
persona: "在 AI/编程行业泡了 5 年，写代码也写思考，对炒作本能反感"
pov: "第一人称单数，偶尔用「我们」指代从业者群体"

chain:
  length_preference: "short"   # short (3-5) / medium (6-10) / long (11+)
  hook_style: "反常识陈述"      # 反常识陈述 / 尖锐提问 / 场景白描 / 数据冲击
  payoff_required: true

hashtags:
  strategy: "none"              # inline / trailing / none
  max_count: 0

reference_threads: []           # permalinks user considers reference style
blacklist_words: []
```

### `history.yaml` append format

```yaml
- date: "2026-04-08T15:30:00Z"
  topic: "AI coding tools reality check"
  segments: 4
  char_total: 1843
  posts:
    - { index: 1, id: "18028...", permalink: "https://threads.net/@user/post/..." }
    - { index: 2, id: "18028...", permalink: "https://threads.net/@user/post/..." }
  stats: null
```

Each publish appends a YAML list item. Never overwrites.

### `lessons.md` auto-learning

When the agent writes a draft in Step 4, it saves **two files side by side**:
- `output/<slug>.md` — the editable working copy the user will publish
- `output/<slug>.md.agent` — a frozen snapshot of the agent's original output (never modified)

If the user edits `output/<slug>.md` before publishing, the two files will diverge. After a successful publish in Step 7, the agent (same conversation, no extra API call) diffs the two files and appends 2-3 rules to `lessons.md`. If the two files are byte-identical, no diff is run.

Both files live in `output/` which is git-ignored, so `.agent` snapshots do not leak into version control.

Example `lessons.md` entry:

```markdown
## 2026-04-08

- User removed filler phrases like "说实话" and "讲真" from all segments → avoid these
- User changed "5 个工具" to "5 款工具" → prefer "款" over "个" for tool counters
- User merged segments 2 and 3 into one shorter segment → hook should land faster
```

Next time the agent writes for this profile, it reads `lessons.md` alongside `voice.yaml` and treats lessons as hard constraints.

**v1 quality note**: The lessons mechanism is included in v1 but is not expected to be highly effective immediately. It ships as a learning loop that improves with usage rather than a polished feature.

### Multiple profiles

Users may create multiple profiles (e.g., `personal`, `company`, `tech-deep`). CLI uses `--profile <name>` to select, defaulting to `default`. Missing profiles trigger the onboarding flow.

## Pipeline

### Steps

| Step | Name | Action | Fallback |
|---|---|---|---|
| 1 | Parse request | Determine topic vs raw-file vs reply; select profile | — |
| 2 | Load profile | Read `profiles/{name}/voice.yaml` and `lessons.md` | Onboarding flow if missing |
| 3 | Research | `youmind.mineTopics` + `youmind.webSearch` | Skip on error |
| 4 | Model-driven writing + splitting | Agent reads `writing-guide.md`, `chain-splitting.md`, profile voice, lessons, research → writes `output/<slug>.md` with segments, and a byte-identical `output/<slug>.md.agent` snapshot for later lessons diffing | Retry invalid segments up to 2x; warn on >12 segments |
| 5 | Preview | Display segments in terminal, immediately publish (no confirm pause) | — |
| 6 | Publish with binding gate | `getBindingStatus` → if unbound, return upsell; else loop createContainer + publishContainer with reply chain | See partial failure below |
| 7 | Sinking | Append `history.yaml`; if draft was edited, agent diffs original vs final and appends `lessons.md`; optional `youmind.saveArticle` archive | Best-effort, log warn on failure |
| 8 | Report | Display first permalink, total segments, profile name | — |

### Draft file format (`output/<slug>.md`)

```markdown
---
profile: default
topic: "AI coding tools reality check"
segments: 4
---

## 1

{segment 1 text, ≤500 chars}

## 2

{segment 2 text, ≤500 chars}

...
```

At the moment the agent writes this file, it also writes `output/<slug>.md.agent` as a byte-identical copy. The user is free to edit `<slug>.md`; `<slug>.md.agent` is the frozen baseline used for the lessons diff in Step 7.

### Routing shortcuts

| User input | Entry point |
|---|---|
| Topic only | Step 2 (full flow) |
| Path to `output/*.md` | Step 5 (skip writing) |
| `reply <parent_id> "<text>"` | Step 4 simplified + Step 6 with `replyToExisting` |
| `preview <input>` | Step 4 + Step 5, halt before Step 6 |
| `validate` / `list` / `profile *` | Direct to `threads-api` or `profile-manager` |

### CLI commands

| Command | Purpose | Profile onboarding |
|---|---|---|
| `publish <input>` | Full flow | Yes if profile missing |
| `preview <input>` | Steps 1-5, no network publish | Yes if profile missing |
| `reply <parent_id> "<text>"` | Reply to existing post | No |
| `validate` | Check YouMind key + Threads binding | No |
| `list [--limit N]` | Recent posts | No |
| `profile list` | List profiles | No |
| `profile show <name>` | Show profile detail | No |

`profile` is a single-file subcommand in `cli.ts`, not a separate binary. Profile selection is always via the `--profile <name>` flag on `publish` / `preview`, defaulting to `default`. There is no "active profile" state file — `profile use` is out of scope for v1.

### Model-driven splitting (agent instructions)

`references/chain-splitting.md` is read by the agent at runtime (not by the skill code). It instructs the agent to:

1. Read the user's profile voice and lessons
2. Structure the thread as Hook → Tension → Body → Payoff
3. Split where the reader naturally draws breath (new claim, emotional beat shift, not mid-argument)
4. Keep Segment 1 tight (60-150 chars), body segments 200-450 chars, payoff 100-300 chars
5. Never add "1/5" style prefixes in the text — Threads UI handles chain display
6. Run each segment through `validateSegment` before saving

The `cleanText`, `validateSegment`, and `appendHashtags` functions in `content-adapter.ts` are the only code-side tools available to the agent during writing.

## Error Handling

| Step | Failure | Behavior |
|---|---|---|
| 2 | `voice.yaml` missing | Trigger onboarding (not an error) |
| 2 | `AskUserQuestion` unavailable | Fall back to plain text multi-choice |
| 3 | `youmind.api_key` missing | Skip research, inform user "no research done, writing from topic alone" |
| 3 | `mineTopics` / `webSearch` error | Log warn, continue |
| 4 | Segment >500 chars | Agent rewrites that specific segment (max 2 retries per segment); hard-truncate with warn if still failing |
| 4 | >12 segments | Warn, ask user to compress |
| 4 | Output doesn't match voice | No runtime enforcement; `lessons.md` handles long-term correction |
| 6 | `bound: false` | **Not an error**: draft already saved, return upsell message |
| 6 | `createContainer` fails on segment 1 | Error exit; draft preserved |
| 6 | `createContainer` fails mid-chain | Stop, save remaining segments to `output/<slug>-remaining.md`, report "published k of N, resume with `publish <remaining-path> --reply-to <last-id>`" |
| 6 | `publishContainer` fails | Print `container_id`, instruct retry via hidden `publish-container <id>` command |
| 6 | Rate limit 429 (250/24h) | Report reset time; draft preserved |
| 6 | Token expires in <7 days (from `expires_at`) | Warn after successful publish; instruct user to re-authorize on YouMind |
| 7 | `history.yaml` write fails | Log warn; publish already succeeded |
| 7 | `lessons.md` diff agent task fails | Skip silently |
| 7 | `youmind.saveArticle` archive fails | Log warn |

### Resilience principles

1. **Writing value is preserved at all costs**: no failure deletes `output/` drafts
2. **Partial chain publishes do not roll back**: Threads has no transactions; what's sent is sent
3. **Sinking failures never fail the main flow**: history, lessons, archive are best-effort

### Upsell message (when unbound)

Displayed in CLI on `publish` with `bound: false`:

```
✔ Thread written: 4 posts, 1843 chars total
✔ Draft saved to: output/<slug>.md

❌ Threads account not bound on YouMind yet

Your thread is ready to go — one more step to publish:
  1. Visit https://youmind.com/settings/integrations
  2. Click "Connect Threads"
  3. Run: npx tsx src/cli.ts publish output/<slug>.md

Once connected, all future posts publish with one command.
```

The message is intentionally framed as "one more step" rather than "you forgot something" to keep the conversion moment positive.

## Open Questions / Deferred

- **Carousel support (2-20 items)**: deferred to v1.1. Requires multi-container flow similar to Instagram skill's carousel logic.
- **Reply thread reading**: v1 only sends replies, does not fetch reply trees. v1.1 may add a `read-replies` command for managing conversations.
- **Stats backfill**: `history.yaml` has a `stats: null` placeholder; a future `threads refresh-stats` command could fetch engagement numbers via YouMind.
- **Cross-profile lessons**: currently lessons are per-profile. A future version may optionally surface cross-profile patterns.
- **YouMind endpoint contract finalization**: the `/threads/*` endpoints in this spec are the skill's assumption. Final shapes to be confirmed during YouMind-side implementation; only `threads-api.ts` needs updating if they differ.

## Implementation Notes

- `youmind-api.ts` is copied verbatim from `youmind-facebook-article/toolkit/src/youmind-api.ts`. The central credentials loading logic is already inside that file — reuse it as-is in `threads-api.ts` (`loadCentralCredentials()` + local config merge).
- `config.yaml` merges with `~/.youmind-skill/credentials.yaml` via the same pattern as other article skills (see `2026-04-01-centralized-credentials-design.md`).
- Draft files in `output/` must use kebab-case slugs (e.g., `ai-coding-tools-thread.md`). The `.agent` snapshot uses the same slug with a `.agent` suffix.
- All text in `references/*.md` that is read at runtime by the agent must be stable across skill updates — users' `lessons.md` and `voice.yaml` depend on consistent instruction semantics. Treat these files as a public API.
- The onboarding flow (first-use profile creation) lives in `cli.ts`, not `profile-manager.ts`. `profile-manager.ts` is IO-only; it does not perform user interaction.
