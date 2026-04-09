# youmind-threads-article

> AI-powered Meta Threads publisher with voice-profile sedimentation and YouMind-proxied OAuth.

Write Threads posts and chains in YOUR voice. Research topics from your YouMind knowledge base, let a model split long-form content into natural thread segments, and publish with one command — no Meta developer portal, no token refresh headaches.

## Why this skill

Most Threads publishing tools make you:

1. Go to the Meta developer portal
2. Register a Meta app
3. Get a long-lived Page access token
4. Refresh it every 60 days manually
5. Repeat for every skill you want to use

This skill uses **YouMind as an OAuth proxy**. You connect Threads once on YouMind's settings page, and every skill that needs Threads access works without ever touching a Meta token.

On top of that, the skill **remembers your voice**:

- `profiles/<name>/voice.yaml` — tone, persona, length preference, hook style
- `profiles/<name>/history.yaml` — append-only log of every publish
- `profiles/<name>/lessons.md` — patterns the agent learns from your edits

Over time, the skill drifts closer to how you actually write, not how a generic AI writes.

## Install

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
```

Fill `youmind.api_key` in `config.yaml`. Get one at [YouMind API Keys](https://youmind.com/settings/api-keys).

Then connect Threads on [YouMind Integrations](https://youmind.com/settings/integrations) (one click).

Verify:

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## Usage

Just ask the agent in natural language:

- "Write a Threads chain about AI coding tools in 2026"
- "Publish `output/ai-thread.md` to Threads"
- "Preview a Threads post about remote work"
- "Reply to Threads post 18028... with: this matches my experience"

The agent will:

1. Ask a one-time onboarding question if you haven't set up a voice profile
2. Research the topic (YouMind knowledge base + web search)
3. Write a draft to `output/<slug>.md`
4. Preview for you
5. Publish — one or many segments as a chain

## CLI reference (if you prefer direct control)

```bash
# Full flow
npx tsx src/cli.ts publish output/my-thread.md

# Preview only
npx tsx src/cli.ts preview output/my-thread.md

# Inline single post
npx tsx src/cli.ts publish "Just shipped my first open-source release."

# Reply
npx tsx src/cli.ts reply 18028123 "Totally agree"

# Account / quota
npx tsx src/cli.ts validate
npx tsx src/cli.ts list --limit 5
npx tsx src/cli.ts limits

# Profiles
npx tsx src/cli.ts profile list
npx tsx src/cli.ts profile show default
npx tsx src/cli.ts profile create --name work --tone "professional, concise" --length medium --hashtags trailing
```

Add `--profile <name>` to any publish/preview to use a non-default voice.

## Draft format

Drafts live in `output/<slug>.md`. Single posts can be inline. Chains use `## N` sections:

```markdown
---
profile: default
topic: "AI coding tools in 2026"
segments: 4
---

## 1

Most people's frustration with AI coding tools starts with "I still have to fix its code."

## 2

It took me a year to realize I was asking for an intern, but what I actually needed was a faster keyboard.

## 3

...
```

Every draft the agent writes also gets a frozen snapshot: `output/<slug>.md.agent`. After a successful publish, the agent diffs the two files and appends learnings to `profiles/<name>/lessons.md` — so next time it writes more like you.

## Limits and constraints

Meta Threads hard limits the skill respects:

| Item | Limit |
|------|-------|
| Chars per post | 500 |
| URLs per post | 5 |
| Publishes / 24h | 250 (per Threads user) |
| Replies / 24h | 1000 (per Threads user) |
| Image | JPEG/PNG, ≤8 MB, 320-1440 px wide |
| Video | MP4/MOV, ≤1 GB, ≤5 min, 23-60 FPS |

Chains of N segments count as N publishes against the 250/24h quota.

## v1 scope

v1 is text + single image/video per first segment + single-level reply chains. Not in v1:

- Carousel (2-20 images) — v1.1
- Reply tree reading — v1.1
- Stats backfill (likes/reposts counts) — future
- Cross-profile lesson sharing — future

> **Note**: The YouMind `/threads/*` proxy endpoints are currently mocked in
> `toolkit/src/threads-api.ts` while YouMind's backend implementation is in
> progress. The mock returns plausible in-memory data and supports env-var
> failure injection (`THREADS_MOCK_UNBOUND`, `THREADS_MOCK_QUOTA_LOW`,
> `THREADS_MOCK_FAIL_AT`). When the real endpoints ship, swapping to real HTTP
> is a single-file change in `threads-api.ts` — nothing else needs to move.

## Troubleshooting

**`Threads account not bound on YouMind yet`**
Visit https://youmind.com/settings/integrations and click "Connect Threads". Re-run publish.

**`Segment N invalid: Segment is 523 chars, max is 500`**
Rewrite that segment to be shorter, or ask the agent to split it.

**`Threads post quota exhausted`**
Meta resets the 24h rolling window gradually. The CLI shows the next reset time.

**`Token expires in N days`**
Re-authorize Threads on YouMind settings. Takes one click.

## Contributing

See `docs/superpowers/specs/2026-04-08-youmind-threads-article-design.md` for the full design doc.

## Links

- [Get YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article)
- [Connect Threads on YouMind](https://youmind.com/settings/integrations?utm_source=youmind-threads-article)
- [More YouMind Skills](https://youmind.com/skills?utm_source=youmind-threads-article)
