# Adaptation Playbook: Existing Article → Ghost-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to Ghost. If the user only has an idea/topic, use `content-generation-playbook.md` instead.

## Step 0 — Intent check + sub-mode

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Cross-post** | Article from blog/Dev.to/Medium | Ghost-native post with cards + excerpt |
| **Condense** | Long article | Newsletter-length post + "read more" link |
| **Revive** | Old Ghost post | Updated post + re-send to newsletter |
| **Excerpt** | Section for a bookmark card | Short post or card embed |
| **Translate** | Article in another language | Translated post with newsletter optimization |
| **Localize** | Same language, different platform voice | Register shift to Ghost editorial |

If no source content → redirect to `content-generation-playbook.md`.

## Step 1 — Source analysis

- **Origin platform**: Blog, Dev.to, Hashnode, Medium, WordPress, etc.
- **Core thesis** (1 sentence)
- **Claims inventory**: Distinct points
- **Asset inventory**: Images, code, diagrams, embeds
- **Canonical URL**: Original URL (if applicable)
- **Email-readiness**: Would this survive email rendering?

## Step 2 — Extract canonical content spec

- **Title candidates** (3): ≤60 chars each (email subject line test)
- **Custom excerpt candidates** (2): 150–250 chars, complete sentences
- **Outline**: Sections
- **Key assets**: Feature image (1200×630), bookmark card URLs, callout content
- **CTA**: Subscribe / upgrade / reply
- **Visibility plan**: public / members / paid
- **Voice markers**: Editorial newsletter tone

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md`. Assess the source:

| Dimension | Gap analysis |
|-----------|-------------|
| Title length | ≤60 chars? Works as email subject? |
| Custom excerpt | Exists? If not, write one (critical for email preview) |
| Feature image | Present? 1200×630? |
| Paragraph length | Short enough for email? (≤4 sentences) |
| Complex layouts | Multi-column, custom CSS? (Will break in email) |
| Cards | Can any content become bookmark/callout/toggle cards? |
| H1 in body | Must be removed (Ghost uses title field) |
| Tone | Editorial newsletter voice? Or needs register shift? |
| CTA | Present? Subscribe/upgrade/reply prompt? |
| Visibility | Should this be public, members, or paid? |

## Step 4 — Restructure

### Newsletter-first transformation

```
Source structure            → Ghost structure
──────────────────────────────────────────────
Blog title                  → ≤60 char email subject line title
(missing)                   → Custom excerpt (150-250 chars)
(missing)                   → Feature image (1200×630)
Long paragraphs             → Short paragraphs (email-friendly)
Inline citations            → Bookmark cards (rich preview)
Info boxes / warnings       → Callout cards
Complex HTML layouts        → Simple sequential layout
Code blocks                 → Ghost code card (test email rendering)
H1 heading in body          → REMOVE (title field handles this)
No CTA                      → Button card + reply prompt
Markdown links              → Hyperlinked text (email-friendly)
(missing)                   → Primary tag (URL routing)
```

### Card opportunities

Review the source for content that maps to Ghost cards:
- Key citations → **bookmark cards** (rich preview with title/excerpt/favicon)
- Important insights → **callout cards** (highlighted box)
- FAQ content → **toggle cards** (expandable)
- CTAs → **button cards** (subscribe, upgrade, visit)
- Image collections → **gallery cards**
- External embeds → **embed cards** (test email rendering first)

### Email rendering safety check

Before finalizing restructure, verify:
- No multi-column layouts (Outlook strips them)
- No custom fonts (fallback to system fonts in email)
- No complex CSS (Gmail strips most of it)
- Images have reasonable file sizes (email clients may clip)
- Code blocks render acceptably (some email clients struggle)

## Step 5 — Transcreate

Register shift to Ghost's editorial newsletter voice:
- Blog casual → conversational authority ("Here's what I think and why")
- Academic formal → accessible expertise (no jargon walls)
- Technical tutorial → narrative-framed tutorial ("I tried X and found Y")
- Marketing → substance-first (promotion at the end, value upfront)

Hook rewrite:
- Source article opening rarely works as newsletter hook
- First 2–3 sentences must earn the email open
- Rewrite for email preview territory

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source too long (>2,500 words) | Condense for newsletter; or toggle cards for detail; or split |
| Complex source layout | Simplify to sequential sections (email-safe) |
| Source has no feature image | Generate or source before publishing |
| Source has no excerpt | Write one — never let Ghost auto-truncate |
| Source code blocks | Test email rendering; switch to images if broken |
| Free vs paid split needed | Lead with free teaser, paywall via visibility tier |
| Source tone is blog-casual | Elevate to editorial newsletter voice |

## Step 7 — Self-critique

- [ ] **Platform-fit**: Reads like a Ghost newsletter? (Not a reposted blog)
- [ ] **Email subject test**: Title works in a crowded inbox?
- [ ] **Custom excerpt**: 150–250 chars, earns the open?
- [ ] **Feature image**: 1200×630, relevant?
- [ ] **H1 absent**: No H1 in body?
- [ ] **Short paragraphs**: All ≤4 sentences?
- [ ] **Cards**: Bookmark, callout, button used strategically?
- [ ] **Email-safe**: No complex layouts, custom fonts, or heavy CSS?
- [ ] **Primary tag**: Chosen for URL routing?
- [ ] **CTA present**: Subscribe/upgrade/reply?
- [ ] **Thesis fidelity**: Core argument preserved?
- [ ] **Attribution**: Source credited? Canonical URL considered?

## Step 8 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [list]
- **Deliberate deviations:** [rules broken and why]
- **Unresolved mismatches:** [gaps]
- **Adaptation stats:** [source word count → Ghost word count, cards added]
- **Newsletter readiness:** [excerpt ✓/✗, email-safe ✓/✗, CTA ✓/✗, feature image ✓/✗]
- **Fidelity:** [thesis preserved ✓/✗]
```
