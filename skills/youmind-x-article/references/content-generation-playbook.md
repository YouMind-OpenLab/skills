# Generation Playbook: Idea → X-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has any existing content (article, notes, outline), use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

Before generating, confirm the user actually wants **new content creation**. If the intent matches any of these, redirect:

| User intent | Redirect to |
|-------------|------------|
| Has a long article to turn into tweets | `content-adaptation-playbook.md` (condense mode) |
| Wants to translate existing content | `content-adaptation-playbook.md` (translate mode) |
| Wants to update an old thread | `content-adaptation-playbook.md` (revive mode) |
| Wants a teaser for another post | `content-adaptation-playbook.md` (excerpt mode) |

If the user has only an idea, topic, or talking points → continue with generation.

## Step 1 — Evidence brief

Before writing any tweet text, the user (or the skill working with the user) must produce an evidence brief. X content without substance is indistinguishable from noise.

Required:
- **Thesis** (1 sentence): The single claim or insight this thread/tweet will deliver
- **Supporting claims** (2–5 bullets): The atomic points that support the thesis
- **Evidence per claim**: Source, data point, personal experience, or example
- **Reader problem**: What the reader cares about that makes this relevant
- **Desired takeaway**: What the reader should think, feel, or do after reading
- **Voice/brand constraints**: Formal? Casual? Technical? Personal brand tone?

If the user cannot provide evidence for their claims → stop and ask. An evidence-free tweet thread is just noise.

## Step 2 — Canonical content spec

Produce a platform-agnostic content spec (this is the pivot representation that adaptation playbooks also consume):

- **Title/hook candidates** (3 options): Not tweet text yet — just the core hook ideas
- **Outline**: Ordered list of claims/points (platform-agnostic)
- **Key assets**: Images needed, data visualizations, code screenshots, links
- **CTA**: What should the reader do after consuming this?
- **Voice markers**: Tone words that define the brand voice

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the canonical spec to X's constraints:

- **Length check**: Can the thesis fit in 1 tweet (280 chars)? → Single tweet. Does it need 2–5 claims? → Short thread. 5+ claims? → Full thread.
- **Hook selection**: Which of the 3 hook candidates works best as an X-native opening? (contrarian > stat > story > checklist > curiosity gap — based on observed platform performance)
- **Thread structure**: Map outline points to individual tweets. Each tweet = one self-contained claim.
- **Media plan**: Which claims benefit from an image, chart, or screenshot? Allocate 1–4 images per tweet max.
- **Link strategy**: External link goes in the LAST tweet only (algorithm de-amplifies mid-thread links).
- **Hashtag plan**: 0–2 total, placed in hook tweet or final tweet only.

## Step 4 — Draft (X-native from scratch)

Write the thread/tweet directly in X's native format. Do NOT write a blog post and then try to fit it into tweets.

### Single tweet format
```
[Hook — strong opinion, stat, or insight]

[Supporting detail or example — 1-2 lines]

[CTA or takeaway — optional]
```
Total: ≤280 characters.

### Thread format
```
Tweet 1 (Hook):
[Contrarian take / stat / story opener — must stand alone and earn the scroll]

Tweet 2-N (Body):
[One claim per tweet, self-contained, rebloggable in isolation]
[Each tweet should make sense if seen individually in someone's feed]

Final tweet (Close):
[TL;DR — 1 sentence recap]
[CTA: follow / RT / bookmark]
[Link to canonical long-form source — if applicable]
```

### X-native writing rules:
- Each tweet is a paragraph, not a sentence fragment
- No "as I mentioned above" — reader may see any tweet in isolation
- Line breaks improve readability; use them
- Emoji: sparingly, for visual scanning (not decoration)
- No markdown (X doesn't render it) — plain text only
- Code: use screenshots, not inline code (no syntax highlighting on X)
- Numbers and stats in tweets earn higher engagement

## Step 5 — Constraint conflict resolution

If a canonical-spec element cannot fit X's constraints, apply the resolution ladder in order:

1. **Refuse + recommend**: "This content requires extended exposition — recommend publishing as a blog post (Ghost/WordPress/Dev.to) and creating a teaser thread with link."
2. **Serialize**: Break into a thread of 5–15 tweets; each tweet = one atomic claim.
3. **Summarize + link**: Thread = summary of key points + link to canonical full-length source.
4. **Split**: Hook thread on X + companion long-form on another platform.

**Never silently truncate.** If a claim can't fit 280 chars even after rewriting, either split it across 2 tweets or drop it with a note to the user.

### Common conflict scenarios on X:
- Long argument (>15 claims) → recommend Long Post (Premium) or serialize into 2 threads
- Code-heavy content → use screenshots; if too many, link to Gist/repo
- Content requiring LaTeX/math → render as image
- Nuanced topic requiring caveats → add a "caveat thread" or link to long-form

## Step 6 — Self-critique

Before presenting to the user, run this checklist:

- [ ] **Platform-fit**: Does this look native to X? (Not a blog post chopped into tweets)
- [ ] **Hook test**: Would the first tweet earn a scroll if seen cold in a feed? Read it as a stranger.
- [ ] **Self-contained test**: Pick any body tweet at random — does it make sense alone?
- [ ] **280-char compliance**: Every tweet within limit (URLs = 23 chars each)
- [ ] **Factuality**: Every claim is sourced, hedged, or first-person experience
- [ ] **Link integrity**: Final tweet link is correct; no mid-thread external links
- [ ] **Voice match**: Tone matches the brand/voice from evidence brief
- [ ] **Hashtag discipline**: 0–2 total, not in every tweet
- [ ] **Thread length**: 5–15 tweets (sweet spot); flag if >15

## Step 7 — Conformance report

Output alongside the draft:

```
### Conformance Report
- **Platform DNA rules applied:** [list which platform-dna.md items shaped the draft]
- **Deliberate deviations:** [any rule we intentionally broke and why]
- **Unresolved mismatches:** [known gaps the user should be aware of]
- **Thread stats:** [tweet count, avg chars/tweet, media count, link placement]
```
