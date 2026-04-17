# Generation Playbook: Idea → Ghost-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has existing content, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an existing article to publish on Ghost | `content-adaptation-playbook.md` (cross-post mode) |
| Wants to condense content for newsletter | `content-adaptation-playbook.md` (condense mode) |
| Wants to update an existing Ghost post | `content-adaptation-playbook.md` (revive mode) |
| Wants an excerpt for another post's card | `content-adaptation-playbook.md` (excerpt mode) |

If the user has only a topic or thesis → continue with generation.

## Step 1 — Evidence brief

Ghost's audience expects editorial substance — curated insight, not surface-level summaries.

Required:
- **Thesis** (1 sentence): The central argument or insight
- **Supporting claims** (2–5 bullets): Evidence chain building the argument
- **Evidence per claim**: Data, reporting, analysis, expert quotes, personal investigation
- **Reader problem**: What does the reader need to know and why now?
- **Desired takeaway**: Informed, persuaded, or equipped to act
- **Voice/brand constraints**: Newsletter brand voice? Personal voice? Publication style?

Ghost publications read like curated newsletters — substance must justify the subscription.

## Step 2 — Canonical content spec

- **Title/hook candidates** (3 options): ≤60 chars each (doubles as email subject line)
- **Custom excerpt candidates** (2 options): 150–250 chars each — complete sentences that earn the email open
- **Outline**: Section flow
- **Key assets**: Feature image (1200×630), inline images, bookmark card URLs
- **CTA**: Subscribe? Upgrade to paid? Reply? Read related?
- **Voice markers**: Tone descriptors
- **Visibility plan**: Public / members / paid / specific tier

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the canonical spec to Ghost's norms:

- **Title**: ≤60 chars; test: would this get opened as an email subject line on a phone?
- **Custom excerpt**: This is the email preview text — most important metadata after title
- **Feature image**: 1200×630; will appear as email hero and social OG
- **Email-first design**: Short paragraphs, clean HTML, no complex layouts
- **Card planning**: Where to use bookmark cards (citations), callout cards (key insights), button cards (CTA)?
- **Primary tag**: Choose deliberately — it determines URL routing and template
- **Visibility**: Public for growth content; paid/members for premium
- **Newsletter send**: Will this post trigger an email? (default: yes for published posts)

## Step 4 — Draft (Ghost-native from scratch)

Write in Ghost's editorial voice. Not a "blog post" — a newsletter-grade publication piece.

### Ghost-native article structure:

```markdown
# [≤60 char title — compelling as email subject]

[Hook — first 2-3 sentences visible in email preview; must earn the open]

## [Section 1 heading]

[Short paragraphs — mobile email friendly]
[Personal authority + evidence: "I've found that..." backed by data]

[Bookmark card: key source/reference with rich preview]

## [Section 2 heading]

[Analysis, reporting, or tutorial content]

[Callout card: key insight or takeaway]

## [Section 3 heading — conclusion/synthesis]

[Summary of argument]

[Button card: member CTA or subscribe prompt]

[Reply prompt: "Reply to this email with your thoughts"]
```

### Ghost-native writing rules:
- **Editorial voice**: Authoritative but personal — "Here's what I think and why"
- **Short paragraphs**: 2–4 sentences max (email clients render long paragraphs poorly)
- **Cards strategically**: Bookmark for citations, callout for insights, button for CTAs — not everywhere
- **No H1 in body**: Ghost uses the `title` field for H1
- **First 2–3 sentences are sacred**: Email preview territory — hook earns the open
- **Custom excerpt**: Write it separately, don't let Ghost auto-truncate
- **Feature image**: Always include; 1200×630 for OG + email hero
- **Schedule consideration**: Consistent day/time helps newsletter cadence and reader expectation

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Content too long (>2,500 words) | Split into multi-part; or use toggle cards for expandable detail |
| Needs complex layout (multi-column) | Simplify — email clients strip complex CSS; use sequential sections |
| Free vs paid content split | Lead with free teaser; paywall after the hook via visibility tier |
| External video embed | Use embed card; test that it renders in email (some don't) |
| Content not email-friendly | Publish as web-only page (rare — Ghost's distribution is email) |

**Never skip the custom excerpt. Never use complex layouts that break in email.**

## Step 6 — Self-critique

- [ ] **Platform-fit**: Does this read like a Ghost newsletter, not a generic blog post?
- [ ] **Email subject test**: Would the title get opened in a crowded inbox?
- [ ] **Custom excerpt**: 150–250 chars, complete sentence, earns the open?
- [ ] **Feature image**: 1200×630, relevant, clean?
- [ ] **Email preview**: First 2–3 sentences are compelling when seen cold?
- [ ] **Paragraph length**: All ≤4 sentences? (mobile email)
- [ ] **Card usage**: Bookmark, callout, button used strategically (not everywhere)?
- [ ] **H1 absent from body**: Only title field provides H1?
- [ ] **Primary tag**: Chosen deliberately for URL routing?
- [ ] **Visibility**: Correct tier selected (public/members/paid)?
- [ ] **CTA present**: Subscribe, upgrade, or reply prompt at closing?
- [ ] **Factuality**: Claims backed by evidence, reporting, or explicit personal experience?
- [ ] **Voice**: Matches editorial newsletter tone, not casual blog?

## Step 7 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [which items from platform-dna.md shaped the draft]
- **Deliberate deviations:** [any rule intentionally broken and why]
- **Unresolved mismatches:** [known gaps the user should address]
- **Post stats:** [word count, card count by type, visibility, primary tag, feature image status]
- **Newsletter readiness:** [custom excerpt ✓/✗, email-safe HTML ✓/✗, CTA present ✓/✗]
```
