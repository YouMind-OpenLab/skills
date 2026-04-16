# Ghost Platform DNA

> **Scope:** This file describes observable platform behavior — format constraints, discourse norms, newsletter engagement patterns, and content conventions derived from Ghost platform data and high-performing publications. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations.

## Platform snapshot (2025)

- 3 million+ installs globally; 18K active Ghost Pro licensees
- Used by 1,200+ journalists (including independents from The Guardian and NYT)
- Notable publications: Platformer, 404Media, Lever News, Tangle, The Browser, Stanford Review, Harvard International Review
- 36% of Ghost users migrated from Substack or Medium in the past 2 years
- Top markets: US, UK, Germany, Canada
- Creator NPS: 72
- **Newsletter metrics:** 53% average open rate, 11% CTR, 6.3% free→paid conversion
- Average paid newsletter price: $6/month
- Subscriber churn: 2.1% monthly average
- Weekly publishing retains 73% of subscribers

## Format constraints

| Element | Constraint |
|---------|-----------|
| Title | No hard limit; **≤60 chars recommended** (doubles as email subject line) |
| Custom excerpt | 150–300 chars; drives email preview, social cards, post cards — **critical** |
| Feature image | 1200×630px recommended (OG social sharing + email hero) |
| Body | HTML via Koenig/Lexical editor; API accepts raw HTML with `?source=html` |
| H1 in body | **Must be omitted** — Ghost uses the `title` field for H1 |
| Word count | 800–2,500 words typical |
| Tags | Flat system; first tag = primary (URL routing + template selection) |
| Internal tags | `#prefix` convention for non-public tags |
| Cards | Bookmark, callout, toggle, gallery, button, embed, HTML, markdown, code, image |
| Visibility | `public` / `members` / `paid` / `tiers` (specific tier gating) |
| Post types | Standard post, page, email-only post |

## Discourse norms (observable)

### Register

- **Editorial.** Ghost publications read like curated newsletters or magazine pieces — professional, authoritative, but with a personal voice
- The email format rewards conversational authority: "Here's what I think and why"
- Not blog-casual and not academic-formal — the sweet spot is informed newsletter voice
- Ghost's journalist-heavy user base sets the tone: reporting + opinion + analysis

### Opening patterns

- **Newsletter teaser:** First 2–3 sentences visible in email preview — must earn the open
- **Contrarian analysis:** "The conventional wisdom about X is wrong. Here's why."
- **Curated briefing:** "Three things worth knowing this week:"
- **Personal stake:** "I've spent [time] investigating X. What I found surprised me."

### Closing patterns

- **Member CTA:** "If you're not yet a member, here's what you're missing:"
- **Subscribe button:** Button card with clear value proposition
- **Bookmark card:** Link to related post for deeper reading
- **Reply prompt:** "Reply to this email" — drives engagement metrics and signals community

### Citation conventions

- Inline hyperlinks (anchor text, not bare URLs)
- Bookmark cards for key references (rich preview with title, excerpt, favicon)
- Pull quotes for notable statements
- Attribution to original reporting/sources

### Self-promo tolerance

- **High** — the newsletter IS the product; promotion is expected and natural
- Balance: substance must justify the subscription ("value-first, ask-second")
- Cross-promotion between newsletters is common and welcomed
- Product sponsors in newsletters are accepted when clearly labeled

## Moderation & flagging patterns

- Ghost is self-hosted or Ghost Pro — moderation is publication-level, not platform-level
- No community downvoting or public flagging system
- Quality enforcement comes from subscriber behavior: opens, clicks, unsubscribes, churn
- Google E-E-A-T applies to SEO-discovered Ghost content
- Ghost Pro has standard content policies (no hate speech, illegal content)

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Custom excerpt | **ALWAYS** — drives email open rate and social sharing |
| Feature image | **ALWAYS** — email hero and post card visual |
| Visibility tiers | Paywall strategy: public teaser + paid full content |
| Email-only posts | Exclusive newsletter content not on website |
| Bookmark cards | Rich-preview citations for key references |
| Callout cards | Important notices, key takeaways, warnings |
| Toggle cards | FAQ sections, expandable detail |
| Button cards | CTA: subscribe, buy, visit |
| Gallery cards | Image collections for visual stories |
| Primary tag | URL routing + template selection — choose deliberately |
| `#internal-tag` | Organization without public display |
| Scheduled publishing | Consistent newsletter cadence (weekly = 73% retention) |
| Newsletter segments | Send to specific subscriber groups |
| Member analytics | Track engagement per subscriber |

## Hard limits (must not violate)

- H1 must be omitted from body HTML — Ghost uses the `title` field
- Custom excerpt is critical — missing excerpt = poor email preview (falls back to first N chars, often cuts mid-sentence)
- HTML body via API: clean standard HTML; complex CSS may be stripped by Mobiledoc layer
- No native series feature — use tag collections for series grouping
- First tag = primary tag = URL routing (changing it after publishing can break URLs)
- Email rendering: avoid multi-column layouts, custom fonts, complex CSS that breaks in Outlook/Gmail

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Long paragraphs | Breaks mobile email reading; subscribers skim and bounce |
| Missing excerpt | Email preview = truncated garbage; open rate tanks |
| Cards everywhere | Visual noise; callouts lose impact when overused |
| Publishing without email send | Ghost's primary distribution is newsletter; web-only = low reach |
| Inconsistent cadence | Weekly = 73% retention; irregular = subscriber drift + 2.1% monthly churn |
| No paid tier option | 6.3% of free subscribers convert if offered — leaving money on the table |
| Complex HTML layouts | Break in email clients (Outlook, Gmail strip custom CSS) |
| Ignoring primary tag | Wrong primary tag = wrong URL structure and wrong template |
| No feature image | Post cards and social shares show blank placeholder |

## Example calibration patterns

**High-engagement Ghost post structure:**
1. Title: ≤60 chars, compelling as email subject line
2. Custom excerpt: 150–250 chars, complete sentence, earns the open
3. Feature image: 1200×630, relevant, clean
4. Opening: Hook in first 2–3 sentences (email preview territory)
5. Body: H2 sections, short paragraphs, bookmark cards for sources, callout for key insight
6. Closing: Summary + member CTA button card + "Reply to this email" prompt
7. Tags: Primary tag for routing, 2–3 secondary for organization
8. Visibility: Consider paid tier for premium content
9. Schedule: Same day/time each week for subscriber expectation

**Newsletter benchmark targets:**
- Open rate: ≥50% (Ghost average: 53%)
- Click-through rate: ≥10% (Ghost average: 11%)
- Free→paid conversion: ≥5% (Ghost average: 6.3%)
- Monthly churn: ≤2.5% (Ghost average: 2.1%)
