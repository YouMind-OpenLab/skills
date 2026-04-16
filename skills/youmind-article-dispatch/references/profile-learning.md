# Profile Learning — How Author DNA Accumulates Over Time

> The author profile is not a form you fill once. It's a **living document** that gets richer and more accurate with every dispatch cycle. This reference defines how user DNA sediments from real usage.

## The Learning Loop

```
  ┌─────────────┐
  │  Dispatch    │ ← topic + author profile (current)
  │  generates   │
  └──────┬──────┘
         │ draft
         ▼
  ┌─────────────┐
  │  User edits  │ ← corrections, rewrites, tone shifts, cuts, additions
  │  the draft   │
  └──────┬──────┘
         │ diff
         ▼
  ┌─────────────┐
  │  Extract     │ ← pattern extraction from edit diff
  │  signals     │
  └──────┬──────┘
         │ proposed updates
         ▼
  ┌─────────────┐
  │  User        │ ← opt-in confirmation (never auto-modify)
  │  confirms    │
  └──────┬──────┘
         │ accepted updates
         ▼
  ┌─────────────┐
  │  Profile     │ → author-profile.yaml updated
  │  updated     │ → learning-log.yaml appended
  └─────────────┘
```

## Five Accumulation Sources

### Source 1 — Edit diffs (strongest signal)

When the user edits a generated draft before publishing, the DIFF between generated and final version is the richest learning signal.

**What diffs reveal:**

| Edit pattern | What it teaches | Profile field affected |
|-------------|-----------------|----------------------|
| Removed marketing phrases | User rejects promotional language | `voice.anti_patterns` |
| Changed "we" → "I" | User prefers first-person | `voice.perspective` |
| Added code blocks to theory sections | User wants more code | `content.code_density` |
| Shortened all paragraphs | User prefers scannable writing | `voice.signature_patterns` |
| Replaced formal terms with casual | User's register is more casual | `voice.register` |
| Added personal anecdote | User values storytelling | `content.storytelling` |
| Deleted sections to shorten | User prefers shorter pieces | `content.typical_length` |
| Rewrote opening to start with problem | User prefers problem-first structure | `voice.signature_patterns` |
| Added data/benchmarks | User is data-driven | `content.data_driven` |

**Implementation:**
After each dispatch where the user edits the draft:
1. Compute diff between generated draft and final published version
2. Classify edits into categories (tone shift, structure change, content add/remove, length change)
3. If a pattern appears 2+ times across dispatches → propose a profile update
4. Never update from a single instance (could be topic-specific, not author-level)

### Source 2 — Platform selection patterns

Which platforms the user publishes to (and which they skip) reveals platform affinity.

**What selection reveals:**

| Pattern | What it teaches | Profile field affected |
|---------|-----------------|----------------------|
| Always publishes to Dev.to, skips LinkedIn | Author is developer-focused, not professional-network | `content.preferred_types` |
| Always includes Qiita | Author writes for Japanese audience | `language.secondary` |
| Skips X consistently | Author doesn't value short-form | `platform_overrides.x` |
| Always publishes to Ghost as paid | Author has premium content strategy | `platform_overrides.ghost` |

**Implementation:**
Track dispatch history: `{date, platforms_requested, platforms_published, platforms_skipped}`. After 5+ dispatches, analyze patterns and propose platform affinity updates.

### Source 3 — YouMind article history (bootstrapping)

If the user has existing articles in YouMind's knowledge base, dispatch can analyze them to bootstrap the profile without starting from zero.

**Bootstrap analysis:**
1. Fetch recent 10-20 articles from YouMind KB via search API
2. For each article, extract:
   - Average paragraph length → register/scannability preference
   - Code block frequency → code density
   - Language used → primary/secondary language
   - Opening pattern (question? story? problem? data?) → hook preference
   - Word count distribution → typical length
   - Technical depth indicators (jargon density, assumed concepts)
3. Aggregate into a proposed profile
4. Present to user: "Based on your recent articles, here's your writing profile. Accurate?"

**When to use:**
- On first install (cold start with data)
- When user says "analyze my writing style"
- Periodically after significant new content (every ~20 articles)

### Source 4 — Engagement feedback (if available)

If the platform returns engagement metrics (views, likes, comments, shares), dispatch can correlate content characteristics with performance.

**What engagement reveals:**

| Metric pattern | What it teaches |
|---------------|-----------------|
| Long Dev.to articles get 3x more reactions than short ones | This author's audience rewards depth |
| X threads with stat hooks outperform story hooks | This author's X audience responds to data |
| Qiita articles with :::note callouts get more LGTM | Code-with-callouts is this author's sweet spot |

**Implementation:**
This is the weakest signal (engagement depends on many factors beyond writing style). Use only as a CONFIRMATION of existing patterns, never as the sole source for profile changes.

**When available:**
- YouMind may track engagement via platform APIs
- Ghost provides open rates, CTR
- Dev.to provides reaction counts
- Not all platforms expose this via OpenAPI

### Source 5 — Explicit corrections (user-initiated)

The user directly tells dispatch to update the profile:
- "I want to write more beginner content from now on"
- "Stop including humor in my articles"
- "Add Japanese as a secondary language"
- "My audience has shifted to engineering managers"

**Implementation:**
Parse the instruction, map to profile fields, update `author-profile.yaml`. Confirm with user before saving.

## Learning Log

All learning signals are recorded in `~/.youmind/learning-log.yaml` (append-only) for transparency and rollback. This is a shared location — see [`../shared/YOUMIND_HOME.md`](../shared/YOUMIND_HOME.md). Dispatch is the primary writer; other skills may append observations but dispatch owns interpretation.

```yaml
# learning-log.yaml — append-only record of profile learning signals
# This file is NOT the profile itself; it's the evidence trail.

entries:
  - date: "2026-04-16T14:30:00Z"
    source: "edit_diff"
    dispatch_id: "dispatch-001"
    platform: "devto"
    observation: "User removed 3 marketing phrases and added 2 code blocks"
    proposed_change:
      field: "voice.anti_patterns"
      action: "add"
      value: "Avoid promotional phrasing in technical tutorials"
    status: "accepted"  # accepted | rejected | pending

  - date: "2026-04-16T14:30:00Z"
    source: "platform_selection"
    dispatch_id: "dispatch-001"
    observation: "User published to Dev.to and Hashnode, skipped X and LinkedIn"
    proposed_change: null  # no change yet (need 5+ data points)
    status: "logged"

  - date: "2026-04-17T09:00:00Z"
    source: "explicit"
    observation: "User said: 'Make my articles more data-driven from now on'"
    proposed_change:
      field: "content.data_driven"
      action: "set"
      value: true
    status: "accepted"

  - date: "2026-04-20T11:00:00Z"
    source: "bootstrap"
    observation: "Analyzed 15 articles from YouMind KB"
    proposed_change:
      field: "voice.register"
      action: "set"
      value: "conversational-technical"
    status: "accepted"
```

## Accumulation Cadence

Not every dispatch triggers a profile review. The schedule:

| Trigger | Action |
|---------|--------|
| First dispatch (cold start) | Offer 5-question onboarding OR bootstrap from YouMind KB |
| After dispatch where user edited significantly (>20% diff) | Extract edit signals, log to learning-log |
| Every 5 dispatches | Review accumulated signals; if ≥2 signals point to same change, propose update |
| User explicitly asks | Immediate profile update |
| Every 20 dispatches | Full profile review: re-analyze recent articles, compare with profile, propose corrections |

## Confirmation Protocol

**Never auto-modify the profile.** All changes go through user confirmation:

```
📝 Profile learning suggestion:

Based on your last 3 dispatches, I noticed:
- You consistently shortened paragraphs to 2-3 sentences
- You added code examples in 2 out of 3 articles where I didn't generate them
- You removed the "conclusion" section in all 3 articles

Proposed profile updates:
1. voice.signature_patterns += "Keep paragraphs to 2-3 sentences"
2. content.code_density: "medium" → "high"
3. voice.signature_patterns += "Skip formal conclusion; end with actionable takeaway"

Accept all? Accept some? Skip?
```

## Rollback

If the user feels the profile has drifted:
- "Reset my profile to the original" → restore from first accepted version
- "Undo the last change" → revert most recent learning-log accepted entry
- "Show me my profile history" → display learning-log with dates and changes

The learning-log enables full traceability: every profile change has a source, date, and evidence.

## Privacy

- `author-profile.yaml` and `learning-log.yaml` are local files, not uploaded
- Edit diffs are analyzed locally by the dispatch skill's agent, not sent to any service
- YouMind KB analysis uses the user's own API key to access their own content
- Engagement data, if fetched, comes from the user's connected platform accounts

## What Good Accumulation Looks Like

After 0 dispatches: empty profile or 5-question skeleton
After 5 dispatches: voice register and code density calibrated
After 10 dispatches: audience depth and platform affinity emerging
After 20 dispatches: signature patterns and anti-patterns solidified from real corrections
After 50 dispatches: profile is a faithful digital twin of the author's writing DNA
