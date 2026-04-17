# Kit Platform DNA

> **Scope:** This file describes observable platform behavior — broadcast editor constraints, creator-profile conventions, newsletter-feed mechanics, and creator-network cues drawn from Kit's official API and help documentation. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations.

## Platform snapshot (2025–2026)

- Kit positions itself around helping creators build and monetize owned audiences
- Official mission page states **250,000 creators using Kit**
- The product surface is not "blog CMS first" — it is **broadcast + creator profile + recommendation network**
- Public posts live in the newsletter feed attached to the Creator Profile or Landing Pages
- Creator Network matching considers topics, creator profile, and the contents of recent broadcasts

## Product surfaces that matter

Kit content has to work across multiple visible surfaces:

1. **Inbox surface** — subject line + preview text + sender identity
2. **Broadcast report surface** — the page where public/private state and follow-up actions live
3. **Creator Profile newsletter feed** — the public archive / mini-blog view for broadcasts
4. **Landing page feed blocks** — optional embedded newsletter feeds
5. **Creator Network discovery** — profile text and featured posts influence recommendation fit

If a draft only works as a generic article body, it is not yet a Kit-native piece.

## Format constraints

| Element | Constraint |
|---------|-----------|
| Subject line | No hard API max beyond field size, but **45–70 chars** is the working sweet spot |
| Preview text | Add it deliberately; should complement subject, not repeat it |
| Body | HTML via API; should stay simple and email-safe |
| Public / private | Broadcast can stay private or be published to web |
| Public URL | May exist in product UI even when API response does not return a stable `publicUrl` |
| Thumbnail | Strongly recommended for public web posts / newsletter feed |
| Sender email | Must be confirmed on Kit side before create/send succeeds |
| Templates | Email template selection affects final rendering, especially inbox polish |
| Word count | **400–1,200** common for strong broadcasts; longer is possible but must scan fast |

## Discourse norms (observable)

### Register

- **Creator-direct.** Reads like a note from a person or team, not like a faceless publication CMS
- **Readable in both inbox and browser.** Clean enough for email, shaped enough for a public page
- **Specific and concrete.** The strongest Kit posts quickly establish what changed, why it matters, and what to do next
- **Friendly but not fluffy.** Warmth is good; long ornamental setup is not

### Opening patterns

- **Immediate update:** "Three changes we made this week..."
- **Direct relevance:** "If you're building with X, here's what actually changed."
- **Short creator note:** "Quick note from me before the details..."
- **Launch framing:** "Today we're releasing..."

Kit openings are usually shorter than Ghost openings. The first screen should work in inbox notifications and as the start of a public post.

### Closing patterns

- **Single CTA:** reply, click, register, buy, or read more
- **Reader-forward transition:** "Here's what to do next" / "If this sounds useful..."
- **Soft community cue:** invite feedback, questions, or next-step action

### Citation conventions

- Inline links over footnote-heavy citation structures
- Use links sparingly and intentionally
- Screenshots / thumbnails matter more than elaborate media layouts

### Self-promo tolerance

- **Medium-high** when value is obvious
- Launches, offers, and creator products are natural fits
- Hard-sell copy without concrete reader value feels off-brand fast

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Subject line | First hook for inbox open; treat as product asset, not metadata |
| Preview text | Secondary hook; should add information, not echo the subject |
| Email template | Determines visual rendering and should be chosen intentionally |
| Public toggle | Controls whether the broadcast becomes a public newsletter post |
| Creator Profile | Public home for newsletter feed; reinforces identity and discoverability |
| Newsletter feed | Broadcast archive / mini-blog; public readability matters |
| Landing Page feed | Useful when public broadcasts are part of the acquisition path |
| Creator Network | Good fit for creator-to-creator recommendation ecosystems |
| Broadcast reports | Operational home for reviewing results and opening the public/private URL |
| A/B subject testing | Valuable when the hook is the key variable |
| Internal notes | Useful for launches, segmentation intent, or CTA tracking |

## Hard limits (must not violate)

- Sender email must be confirmed or the create/send flow can fail
- Public/private choice is not cosmetic — it changes where the broadcast is visible
- API may omit a stable public URL even when the broadcast exists; do not promise the URL blindly
- Body HTML should remain email-safe; avoid complex multi-column assumptions
- Subject line and preview text are not optional craft details — they are core performance surfaces

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Blog-style throat clearing in the first 3 paragraphs | Loses the inbox scan before value is clear |
| Preview text that just repeats the subject | Wastes the second hook surface |
| Over-designed or layout-heavy HTML | Email clients and templates flatten it badly |
| Public post without thumbnail / SEO intent | Weak newsletter-feed presentation |
| Hard-selling before context | Feels promotional instead of creator-trust-based |
| Too many sections or long walls of text | Broadcasts are read quickly, often on mobile |
| Writing as if Creator Profile doesn't exist | Misses the public archive / discovery surface |
| Ignoring the Creator Network context | Makes the post less useful as a representative public artifact |

## Example calibration patterns

**Strong Kit broadcast structure:**
1. Subject line that creates curiosity or relevance
2. Preview text that adds a second reason to open
3. First paragraph that says what changed and why it matters
4. 2–4 compact sections with clear subheads
5. One obvious CTA
6. Public/private decision made intentionally
7. Thumbnail added if the post is meant to live publicly

**Best-fit content types:**

| Type | Why it fits Kit |
|------|------------------|
| Weekly creator update | Matches repeat-broadcast rhythm |
| Launch note | Subject line + CTA heavy, public archive useful |
| Behind-the-scenes note | Good creator-voice content |
| Product change log | Tight update cadence, browser + inbox readability |
| Curated digest | Strong for recurring feed/archive behavior |

**Weak-fit content types:**

| Type | Why it underperforms |
|------|-----------------------|
| SEO keyword-stuffed pillar article | Wrong surface; doesn't leverage inbox/feed dynamics |
| Academic whitepaper voice | Too cold for creator-direct channels |
| Deep code-heavy walkthrough with many long blocks | Better on Dev.to / Hashnode / WordPress unless tightly adapted |
