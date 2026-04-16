# Author Profile Specification

> The author profile captures **user-level writing DNA** — preferences that travel with the person across platforms. It complements platform-level DNA (which lives in each skill's `platform-dna.md`) without duplicating it.

## Why This Exists

Two writers publishing about the same topic on the same platform will produce different content because of WHO they are:
- One prefers code-first tutorials; the other prefers narrative case studies
- One writes for beginners; the other for senior architects
- One uses humor; the other stays clinical
- One writes in English and Chinese; the other only in English

Platform DNA controls what the PLATFORM rewards. Author DNA controls what the AUTHOR delivers. The dispatch skill merges them.

## Profile Location

**Canonical:** `~/.youmind/author-profile.yaml`

This is a shared home directory that any YouMind skill can read, not a dispatch-owned file. See [`/shared/YOUMIND_HOME.md`](/shared/YOUMIND_HOME.md) for the full convention.

**Why not inside the dispatch skill?** Because Author DNA is user-level, not skill-level. A user who installs only one platform skill (without dispatch) still has a writing voice — their profile must still be accessible. `~/.youmind/` ensures the profile survives regardless of which YouMind skills are installed.

Copy from `author-profile.example.yaml` (dispatch ships a template) and customize. Dispatch reads/writes the canonical `~/.youmind/` location at Step 2 (Content Brief Generation) before dispatching to platform skills. Platform skills also read it directly at their own Step 3 (Apply platform DNA).

## Profile Dimensions

### voice — How you write

| Field | Type | Purpose |
|-------|------|---------|
| `register` | enum | Default writing register across platforms |
| `perspective` | enum | Point of view (first-person, third-person, team) |
| `signature_patterns` | list | Patterns you ALWAYS want — dispatch enforces across platforms |
| `anti_patterns` | list | Patterns you NEVER want — dispatch flags violations |
| `humor_level` | enum | Humor tolerance |

### audience — Who you write for

| Field | Type | Purpose |
|-------|------|---------|
| `primary` | string | One-sentence primary reader persona |
| `secondary` | string | Secondary reader persona |
| `assumed_knowledge` | list | What readers already know (skip basics) |
| `content_depth` | enum | Default depth level |

### content — What you produce

| Field | Type | Purpose |
|-------|------|---------|
| `preferred_types` | list | Content types you gravitate toward |
| `avoid_types` | list | Content types to warn about |
| `code_density` | enum | How code-heavy your content is |
| `data_driven` | bool | Whether you back claims with data |
| `storytelling` | enum | Narrative level |
| `typical_length` | string | Word count range |

### language — Language preferences

| Field | Type | Purpose |
|-------|------|---------|
| `primary` | string | Primary writing language (ISO 639-1) |
| `secondary` | list | Additional languages |
| `bilingual_strategy` | enum | translate / transcreate / language-native |

### platform_overrides — Per-platform author preferences

User-level overrides for specific platforms. These are YOUR preferences (e.g., "I prefer shorter threads on X"), not the platform's rules. Platform DNA hard limits always win.

## Cold Start — First Dispatch IS the Profiling Session

The profile is NOT built in a separate step. It's built DURING the first dispatch, so the first article already benefits from it.

### Path A — Bootstrap from YouMind KB (preferred, near-zero friction)

If the user has existing articles in YouMind's knowledge base:

1. Fetch recent 10–15 articles via YouMind search API
2. Analyze across articles to extract:
   - Average paragraph length → register / scannability
   - Code block frequency → code density
   - Language distribution → primary / secondary language
   - Opening patterns (question / story / problem / data) → hook preference
   - Word count distribution → typical length
   - Depth indicators (jargon density, assumed concepts) → content depth
   - Closing patterns → CTA style
   - Tone markers (first-person frequency, humor indicators) → voice register
3. Propose a complete profile to the user with evidence
4. User confirms or adjusts → save to `author-profile.yaml`
5. Immediately proceed with the first dispatch — profile is already active

**Advantage:** Profile based on REAL writing, not self-reported preferences. Users often misjudge their own style — their articles don't lie.

### Path B — 3 Inline Questions (cold start, no existing articles)

If no YouMind KB articles exist, embed 3 targeted questions INTO the first dispatch request. Not a separate form — part of the conversation flow:

**Q1 — Style** (maps to `voice.register` + `voice.signature_patterns`):
```
(a) 代码先行 / Code first → register: technical, pattern: "code before theory"
(b) 故事驱动 / Story-driven → register: conversational, storytelling: heavy
(c) 数据说话 / Data-driven → register: analytical, data_driven: true
(d) 手把手 / Step-by-step → register: educational, content_depth: beginner
```

**Q2 — Audience** (maps to `audience.primary` + `audience.content_depth`):
```
(a) 做产品的开发者 → primary: "developers building products", depth: practitioner
(b) 学习中的学生 → primary: "students and newcomers", depth: beginner
(c) 做决策的 TL → primary: "tech leads and architects", depth: expert
(d) 泛科技读者 → primary: "general tech audience", depth: intermediate
```

**Q3 — Anti-patterns** (maps to `voice.anti_patterns`, free text):
```
User writes: "不要营销话术，不要 AI 味，不要太长"
→ anti_patterns: ["No marketing language", "No AI-sounding phrases", "Keep concise"]
```

After 3 answers:
1. Map to `author-profile.yaml` fields immediately
2. Save profile
3. Continue the dispatch WITHOUT a second round-trip — the first article is generated WITH the profile active
4. After publishing: "Saved as your writing profile. Next time just say '帮我分发'."

### Why NOT a 5-question form?

| Approach | Problem |
|----------|---------|
| 5-question separate form | Feels like homework; delays first dispatch; users skip or rush it |
| After-the-fact learning only | First 5 dispatches produce generic content — bad first impression |
| **3 inline questions during first dispatch** | Low friction; profile active from Article #1; feels like natural conversation |
| **KB bootstrap** | Zero friction if data exists; based on real writing, not self-report |

## Profile Evolution — Five Accumulation Sources

The profile is a living document that gets richer with every dispatch cycle. See `references/profile-learning.md` for the full learning pipeline.

### Five sources of learning (strongest → weakest):

1. **Edit diffs** (strongest): When the user edits a generated draft, the diff reveals corrections — shortened paragraphs, removed marketing phrases, added code blocks, tone shifts. After 2+ consistent signals across dispatches, dispatch proposes a profile update.

2. **Platform selection patterns**: Which platforms the user publishes to vs. skips reveals platform affinity. Tracked over 5+ dispatches before proposing changes.

3. **YouMind article history** (bootstrapping): On first install, dispatch can analyze 10-20 existing articles from the user's YouMind knowledge base to bootstrap a profile without starting from zero.

4. **Engagement feedback** (if available): Platform engagement metrics (views, likes, open rates) correlate content characteristics with performance. Used as confirmation only, never sole source.

5. **Explicit corrections**: User directly says "make my articles more data-driven" → immediate profile update.

### Accumulation cadence

| Trigger | Action |
|---------|--------|
| First dispatch | Offer onboarding OR bootstrap from YouMind KB |
| User edited draft >20% | Extract edit signals → log |
| Every 5 dispatches | Review signals; propose updates if ≥2 point same direction |
| Every 20 dispatches | Full profile review vs recent articles |

### Confirmation protocol

**Never auto-modify.** All changes go through user confirmation with evidence ("Based on your last 3 dispatches, I noticed you consistently..."). User can accept all, accept some, or skip. Full rollback available via `learning-log.yaml`.

See `references/profile-learning.md` for implementation details, diff analysis patterns, learning log format, and privacy guarantees.

## Multi-Author Support

If multiple people use the same dispatch installation:

- **Option A:** Maintain multiple profile files (`author-profile-alice.yaml`, `author-profile-bob.yaml`) and select via config or CLI flag
- **Option B:** Use the `author.name` field to prompt "Who is writing today?" at dispatch start

Recommendation: start with single-author (most common for individual creator tools). Add multi-author if demand appears.

## What the Profile is NOT

- **Not a template.** It doesn't dictate article structure — platform playbooks do that.
- **Not platform rules.** It doesn't know about :::note syntax or 280-char limits — platform DNA handles that.
- **Not content.** It doesn't contain drafts or articles — just preferences.
- **Not mandatory.** Everything works without it; it's an enhancement layer.
