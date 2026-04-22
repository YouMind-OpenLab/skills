# Generation Playbook: Idea → Beehiiv-Native Post

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user already has source material, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an existing article or newsletter to repurpose | `content-adaptation-playbook.md` (cross-post mode) |
| Wants a shorter Beehiiv version of a long article | `content-adaptation-playbook.md` (condense mode) |
| Wants to refresh an older Beehiiv post | `content-adaptation-playbook.md` (revive mode) |
| Wants a teaser or premium upgrade note | `content-adaptation-playbook.md` (excerpt mode) |

If the user only has a topic, thesis, or rough idea → continue with generation.

## Step 1 — Evidence brief

Beehiiv posts usually serve a publication objective, not just a writing objective.

Required:
- **Angle** (1 sentence): the one point this edition is making
- **Publication objective** (1 item): acquire, retain, monetize, announce, or recap
- **Reader value** (1 sentence): why a subscriber should care now
- **Primary CTA** (1 item): reply, share, buy, register, upgrade, read more
- **Operating context** (bullets): weekly memo, launch, digest, sponsor note, operator update, premium teaser
- **Proof points** (2–5 bullets): numbers, screenshots, links, examples, release facts
- **Surface decision**: web only, email only, or both
- **Audience decision**: all, free only, premium only, or segmented

If publication objective or CTA is unclear, stop and clarify. Beehiiv content gets weak fast when it has no routing intent.

## Step 2 — Canonical content spec

Before drafting the body, define the surrounding post object:

- **Title candidates** (3): publication-grade web titles
- **Subtitle candidates** (2): sharpen the promise, not duplicate the title
- **Email subject candidates** (2–3): only if email surface matters
- **Preview text candidates** (2): add a second reason to open
- **Opening options** (2): one direct, one slightly more editorial
- **Template decision**: use existing template or freeform
- **Recipients**: `web`, `email`, free/premium tiers
- **Feed behavior**: visible or hidden from the feed
- **Growth settings**: capture popup / inline, social share placement if relevant
- **SEO / slug / thumbnail**: only if the web archive matters

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the spec to Beehiiv's real product surfaces:

- Title + subtitle should work as a publication artifact
- Subject + preview text should be written intentionally if this could send
- First screen should justify the edition immediately
- Template choice should happen before formatting decisions
- Audience routing should be explicit for free/premium publications
- Growth and monetization cues should support the post, not overwhelm it
- Web/feed behavior should be chosen, not left accidental

## Step 4 — Draft (Beehiiv-native from scratch)

Write like a publication operator, editor, or creator business sending a purposeful edition.

### Recommended structure

```markdown
# [Title lives in Beehiiv title field]

[Opening paragraph: why this edition exists now]

## What changed
[Concrete update, observation, or thesis]

## What it means
[Reader-facing implication or analysis]

## What to do next
[Single CTA]
```

Optional fourth section:
- `## For paid readers` / `## One more note` / `## Sponsor / resource`

### Writing rules

- Do not write the body as if title/subtitle/subject/preview do not exist
- Prefer 1–3 sentence paragraphs
- Keep section count low unless it is a digest format
- Use clean lists, recaps, and "what matters" framing
- If the post is public, make sure it also reads well as a web article
- If the post is monetized or premium, separate editorial value from the pitch

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Draft reads like a search-first pillar article | Reframe for edition rhythm, publication voice, and inbox scanning |
| User wants dense code walkthrough | Summarize the insight in Beehiiv and link out to the full tutorial |
| User wants everything public and sent to everyone | Confirm web/email/tier routing before publish |
| User wants recurring design but no template selected | Inspect templates first |
| User wants guaranteed publish/send | Explain Send API / plan caveats before promising success |

## Step 6 — Self-critique

- [ ] **Platform-fit**: Does this feel like a Beehiiv publication post, not a generic blog page?
- [ ] **Title + subtitle**: Are both doing distinct work?
- [ ] **Subject + preview**: Intentionally written if email matters?
- [ ] **First screen**: Explains why this issue exists now?
- [ ] **Template**: Chosen deliberately if layout consistency matters?
- [ ] **Audience routing**: Free/premium or web/email intent decided?
- [ ] **Feed behavior**: Visible/hidden chosen intentionally?
- [ ] **CTA**: One main next action?
- [ ] **Tone**: Publication-direct, clean, and commercially aware without sounding spammy?

## Step 7 — Conformance report

```text
### Conformance Report
- Platform DNA rules applied: [...]
- Deliberate deviations: [...]
- Unresolved mismatches: [...]
- Surface plan: web | email | both
- Audience routing: all | free | premium | segmented
- Template decision: [...]
- CTA: [...]
```

## Step 8 — Publish handoff

Before publish, confirm:
1. Draft or confirmed?
2. Web, email, or both?
3. Feed visible or hidden?
4. Which audience / tier?
5. Which template?

If any of these are uncertain, default to safer handling and explain the tradeoff.
