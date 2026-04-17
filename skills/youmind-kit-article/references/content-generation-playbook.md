# Generation Playbook: Idea → Kit-Native Broadcast

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user already has a source article or newsletter draft, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an existing article to repurpose into Kit | `content-adaptation-playbook.md` (cross-post mode) |
| Wants a shorter broadcast from a long article | `content-adaptation-playbook.md` (condense mode) |
| Wants to refresh an older Kit broadcast | `content-adaptation-playbook.md` (revive mode) |
| Wants a short teaser post for public feed only | `content-adaptation-playbook.md` (excerpt mode) |

If the user only has a topic, thesis, or rough idea → continue with generation.

## Step 1 — Evidence brief

Kit rewards clarity and relationship-based context. The broadcast should feel like it came from a real creator or team with a reason to send it now.

Required:
- **Angle** (1 sentence): The one thing this broadcast is about
- **Reader value** (1 sentence): Why should the subscriber care today?
- **Primary CTA** (1 item): What should the reader do next?
- **Operating context** (bullets): launch, weekly update, creator note, digest, product change, etc.
- **Proof points** (2–5 bullets): links, numbers, examples, screenshots, updates
- **Visibility intent**: public, private, or undecided

If the CTA is unclear, stop and clarify. Kit broadcasts usually perform best when they push one clear next action.

## Step 2 — Canonical content spec

- **Subject line candidates** (3): each with a different hook strategy
- **Preview text candidates** (2): must add information, not duplicate the subject
- **Opening options** (2): one direct update, one slightly more personal
- **Outline**: 2–4 compact sections only
- **Thumbnail plan**: needed if the piece is intended for the public feed
- **Publishing mode**: public web, private draft, or web+email timing plan
- **Email template choice**: use existing template if the user has a known preferred rendering

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the spec to Kit's real surfaces:

- **Subject** must feel native to inboxes
- **Preview text** must make the open more likely, not just restate the subject
- **First paragraph** must work for both inbox preview and public feed reading
- **Section count** should stay low — compact broadcasts outperform bloated posts
- **CTA** should be singular and visible
- **Public/private** should be chosen intentionally, not as an afterthought
- **Creator identity** should be legible — this is part of the Creator Profile and recommendation surface

## Step 4 — Draft (Kit-native from scratch)

Write like a creator or team sending a one-off note with purpose.

### Recommended broadcast structure

```markdown
# [Subject line lives outside the body]

[Short opening note — one paragraph, immediate context]

## What changed
[Concrete update]

## Why it matters
[Reader-facing implication]

## What to do next
[Single CTA]
```

### Writing rules

- Do not open like a generic blog post
- Prefer 1–3 sentence paragraphs
- Subject line and preview text should be written intentionally before finalizing the body
- Keep the first screen high-signal
- Avoid multiple competing CTAs
- Public broadcasts should still read cleanly on the web

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Broadcast is turning into a long article | Condense to 2–4 sections or route to a more article-native platform |
| User wants hard-sell language | Keep commercial intent, but lead with reader value first |
| User wants dense code content | Summarize in the broadcast and link out to the full article |
| User wants "private but shareable" | Explain that private state changes visibility and may require checking `campaigns` or the report page |
| Public post has no thumbnail plan | Add one before publish if the feed/archive matters |

## Step 6 — Self-critique

- [ ] **Platform-fit**: Does this read like a Kit broadcast, not a generic post?
- [ ] **Subject line**: Would a creator actually send this?
- [ ] **Preview text**: Adds value beyond the subject?
- [ ] **First screen**: Explains what changed and why it matters?
- [ ] **Section count**: 2–4 compact sections max?
- [ ] **CTA**: One obvious next step?
- [ ] **Visibility choice**: Public/private decided intentionally?
- [ ] **Thumbnail**: Planned if this should live on the public feed?
- [ ] **Tone**: Friendly, direct, specific — not fluffy?

## Step 7 — Conformance report

```text
### Conformance Report
- Platform DNA rules applied: [...]
- Deliberate deviations: [...]
- Unresolved mismatches: [...]
- Subject/preview strategy: [...]
- Visibility plan: public | private | undecided
- CTA: [...]
```

## Step 8 — Publish handoff

Before publish, confirm:
1. Public or private?
2. Use which email template?
3. Is the sender email already confirmed?

If any of these are uncertain, default to safer handling and explain the tradeoff.
