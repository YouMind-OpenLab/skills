# Ghost Platform DNA

> **Scope:** This file describes observable Ghost behavior from official docs: newsletters, post visibility, custom excerpts, feature images, editor cards, public previews, and email-safe publication design. It does NOT make claims about demographics or publication psychology.

## Platform snapshot (2026)

- Ghost is not just a blog CMS; it is a **publishing + membership + newsletter** product
- A post can simultaneously matter to:
  - the **website**
  - the **email newsletter**
  - **free vs paid members**
  - **specific newsletters**
  - **card-based editor surfaces**
- Ghost newsletters can be scheduled and delivered to **free members, paid members, or segments**
- Sites have one newsletter by default, but Ghost officially supports **multiple newsletters**
- The product includes an official **customizable HTML newsletter template**

If a draft only works as a generic web article, it is not yet Ghost-native.

## Product surfaces that matter

Ghost content often needs to work across several surfaces:

1. **Inbox surface** — title, custom excerpt, email-safe first screen
2. **Website surface** — post page, feature image, tags, access level
3. **Membership surface** — public, members-only, paid-only, or tiered visibility
4. **Newsletter surface** — newsletter selection, send timing, audience segments
5. **Editor-card surface** — bookmark, callout, button, email-content, public-preview, and other cards

Strong Ghost content is designed across these surfaces before publish.

## Format constraints

| Element | Constraint |
|---------|-----------|
| Title | Practical sweet spot **45–70 chars**; often doubles as the email subject |
| Custom excerpt | High-priority summary field; drives previews and cards |
| Feature image | Strongly recommended for post cards and social/share contexts |
| Body | HTML via the editor/API; keep it clean and email-safe |
| H1 in body | Omit it; Ghost uses the title as H1 |
| Tags | Flat taxonomy; first tag acts as the primary tag |
| Internal tags | `#` prefix for internal organization |
| Visibility | `public`, `members`, `paid`, or `tiers` |
| Newsletters | One default newsletter, with support for multiple newsletters |
| Cards | Official cards include bookmark, email content, call to action, public preview, button, callout, toggle, gallery, and more |

## Discourse norms (observable)

### Register

- **Editorial-newsletter native.** Feels like a publication or operator note, not a generic CMS article
- **Reader-trust first.** The strongest Ghost posts feel curated and intentional
- **Email-aware.** Openings and sections must survive inbox scanning
- **Premium-capable.** Free and paid experiences can coexist in one post object

### Opening patterns

- quick editorial hook
- why-now framing
- concise briefing opening
- personal authority or investigated insight

### Closing patterns

- subscribe / upgrade / reply CTA
- related-reading or bookmark suggestion
- paid/member conversion cue when relevant

### Citation conventions

- inline links are standard
- bookmark cards are especially native for references/resources
- callout cards work well for key takeaways

### Self-promo tolerance

- High when it is clearly part of the publication relationship
- Sponsored or conversion-oriented cues can fit well, but they should follow real value

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Custom excerpt | High-priority metadata for previews and newsletter contexts |
| Feature image | Important for post cards and share surfaces |
| Public preview card | Lets free visitors preview paid/member content |
| Email content card | Adds content visible only in the newsletter send |
| Call to action card | Useful for subscriptions, sponsors, launches, and upgrade prompts |
| Bookmark card | Rich citation / recommended-reading pattern |
| Callout card | Highlight key takeaways or important notices |
| Primary tag | Routing, organization, and template context |
| `#internal-tag` | Internal ops / segmentation without public display |
| Multiple newsletters | Match content to the right audience/product line |
| Newsletter template settings | Brand consistency across the inbox |

## Hard limits (must not violate)

- H1 should not appear inside body HTML
- Custom excerpt should be written intentionally; do not leave it to a weak fallback
- Email rendering requires simple, email-safe HTML
- The first tag is primary; choose it deliberately
- Access level and public-preview placement must agree with the membership intent
- Newsletter selection and sendability matter; Ghost is operationally more than a website post

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Writing as if Ghost is only a blog | Misses newsletter, members, and card surfaces |
| Missing custom excerpt | Weak preview and distribution surfaces |
| No access strategy on premium-like content | Misses Ghost's strongest product capability |
| Complex layout/CSS assumptions | Email clients flatten or break it |
| Cards used everywhere | Visual noise and weak hierarchy |
| Ignoring email-content/public-preview cards | Misses native Ghost workflows |
| Long wall-of-text paragraphs | Weak inbox and mobile reading behavior |
| Random primary tag choice | Hurts route/template coherence |

## Example calibration patterns

**Strong Ghost post structure:**
1. Title that can survive as an email subject
2. Custom excerpt that earns the open
3. Feature image if the post is meant to circulate
4. Opening that works in both inbox and browser
5. 2–5 compact sections
6. Strategic use of bookmark/callout/button/public-preview/email-content cards
7. Visibility and newsletter choices made explicitly
8. Closing CTA for reply, subscribe, upgrade, or related reading

**Best-fit content types:**

| Type | Why it fits Ghost |
|------|--------------------|
| Editorial newsletter issues | Core Ghost behavior |
| Member-gated essays | Visibility + preview tools are native |
| Curated briefings | Newsletter + card patterns fit well |
| Thought leadership with paid tier | Strong fit for membership publishing |
| Journalistic / analysis notes | Editorial surface is a natural match |
