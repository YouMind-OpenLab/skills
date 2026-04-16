# WordPress Platform DNA

> **Scope:** This file describes observable platform behavior — format constraints, SEO conventions, discourse norms, and content patterns derived from WordPress ecosystem data and high-performing sites. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations.

## Platform snapshot (2025–2026)

- 43.4% of all websites run WordPress; 59.9% CMS market share
- 518 million+ websites powered by WordPress
- 97% of bloggers prefer WordPress (among self-hosted/managed options)
- Strong in: education (~75%), tech (~15%), eCommerce (~13%)
- Notable users: BBC, TechCrunch, CNN, Sony Music, White House, Time
- WooCommerce: 8.8% of all websites (dominant ecommerce plugin)
- CMS market: $30.91B (2025), projected $45.71B by 2030
- WordPress market share declining slightly (from 65.2% peak in 2022 to ~60% in 2025) — but still 9× larger than Shopify (#2)

## Format constraints

| Element | Constraint |
|---------|-----------|
| Title | **≤60 chars** for SERP snippet; keyphrase inclusion critical |
| Slug | Separate from title; lowercase-hyphenated; stable (redirect on change) |
| Excerpt | Separate field; meta description fallback; **≤155 chars** for SERP |
| Featured image | Theme-dependent; **1200×630** safe default (OG social sharing) |
| Categories | Hierarchical tree; 1–2 primary per post |
| Tags | Flat taxonomy; 5–10 typical |
| Body | Gutenberg blocks (modern WP) or Classic editor (HTML) |
| Alt text | **Required** on every image (accessibility + SEO) |
| Heading hierarchy | H1 = title only; H2 for sections; H3 for subsections |
| Word count | 500–3,000; SEO pillar content often 2,000+ |

## Discourse norms (observable)

### Register

WordPress is a CMS, not a community — register varies by site type:
- **SEO-driven content:** Professional, structured, scannable
- **Personal blogs:** Conversational, first-person
- **Business/corporate:** Formal, brand-aligned
- **Common denominator:** Scannable structure (headings, bullets, short paragraphs)

### Opening patterns

- **Keyphrase in first paragraph** — SEO best practice enforced by Yoast/RankMath
- **Problem framing:** "You've just deployed your app and..."
- **Answer preview:** Tell readers what they'll learn before they scroll
- **No filler openers:** "In today's rapidly evolving..." → penalized by readers and SEO

### Closing patterns

- **CTA block:** Subscribe, read related, download resource
- **Related posts widget:** Usually auto-injected by theme/plugin
- **Comment prompt:** "What's your experience with X?"
- **Author bio:** E-E-A-T signal for Google

### Citation conventions

- Inline hyperlinks with keyword anchor text
- `rel="nofollow"` for sponsored/affiliate links (Google policy)
- Internal links: ≥1 to related posts (SEO signal)
- Outbound links: ≥1 to authority source (E-E-A-T signal)

### Self-promo tolerance

- **High** (site owner controls) — but Google penalizes thin affiliate content, keyword stuffing, doorway pages
- E-E-A-T increasingly important: content must demonstrate Experience, Expertise, Authoritativeness, Trustworthiness
- Product reviews need genuine, first-hand experience (Google Reviews Update)

## Moderation & flagging patterns

- WordPress itself has no platform-level moderation (it's a CMS, not a community)
- Quality enforcement comes from:
  - **Google rankings:** Core Updates penalize low-quality, thin, or AI-generated-without-value content
  - **SEO plugin warnings:** Yoast/RankMath score and highlight issues in real time
  - **User signals:** Bounce rate, time-on-page (indirect quality signals)
- WordPress.com hosted sites have additional content policies

## SEO plugin rubric (Yoast / RankMath)

These are the observable "rules" that WordPress SEO plugins enforce — they function as de facto platform norms:

| Check | Requirement |
|-------|------------|
| Focus keyphrase | In title, first paragraph, URL, ≥1 H2, meta description |
| Meta description | ≤155 chars, contains keyphrase, is a complete thought |
| Outbound links | ≥1 DoFollow to authority source |
| Internal links | ≥1 to related post |
| Alt text | On every image; keyphrase in ≥1 image alt |
| Heading hierarchy | H1 once (title); H2 sections; H3 subsections |
| Readability | Flesch score target; short paragraphs; transition words; passive voice ≤10% |
| Keyphrase density | 0.5–2.5% (not stuffing) |
| Previously used keyphrase | Warn if targeting same keyphrase as another post |
| Content length | Flag if under ~300 words |

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Gutenberg blocks | Rich layout: columns, media, callouts, code, tables, cover |
| Categories (hierarchical) | Site navigation; 1–2 per post |
| Tags (flat) | Content grouping; 5–10 per post |
| Featured image | Social sharing + post cards + SEO |
| Excerpt field | Meta description + RSS summary |
| Permalink structure | `/%postname%/` for SEO-friendly URLs |
| Schema markup plugins | Article, HowTo, FAQ, Recipe → rich snippets |
| Scheduled publish | Consistent cadence; set publish date |
| Revisions | Version history for collaborative editing |
| Redirects | SEO safety when changing slugs |
| Custom fields | Structured metadata |

## Hard limits (must not violate)

- H1 should appear only once (= post title) — multiple H1 = SEO penalty
- `upload_max_filesize`: server-dependent, typically 2–64MB
- Theme-dependent rendering: Gutenberg blocks may render differently per theme
- Plugins may restrict allowed HTML in body
- WP REST API field names: `slug`, `excerpt`, `featured_media`, `categories`, `tags`, `status`, `meta`
- Categories are hierarchical, tags are flat — do NOT confuse them

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Multiple H1 headings | SEO penalty; confuses document structure |
| Keyword stuffing | Google penalizes; SEO plugins flag red |
| Thin content for target keyphrase | Helpful Content Update penalizes |
| Missing alt text | Accessibility violation + missed SEO signal |
| Broken internal links | Crawl errors; user frustration |
| Duplicate H2 text | Confuses search engines; looks lazy |
| No featured image | Weak social sharing; post cards show placeholder |
| Missing excerpt/meta description | SERP shows auto-generated snippet (often poor) |
| Categories used as tags (or vice versa) | Breaks site structure and navigation |
| Publish-and-forget | Stale content loses rankings; update/revive strategy critical |
| Code blocks without language tags | No syntax highlighting; unprofessional appearance |

## Example calibration patterns

**High-ranking WordPress article structure:**
1. Title: ≤60 chars, keyphrase front-loaded
2. Slug: lowercase-hyphenated, matches keyphrase
3. Featured image: 1200×630, alt text with keyphrase
4. Excerpt/meta: ≤155 chars, keyphrase included, value proposition
5. First paragraph: Problem statement + keyphrase
6. H2 sections: 3–7 major sections, each addressing a sub-topic
7. Code/examples: With language tags, runnable where applicable
8. Internal links: 2–5 to related posts
9. Outbound link: ≥1 to authority source
10. Conclusion: Summary + CTA
11. Categories: 1–2 primary
12. Tags: 5–10 relevant
13. Schema: Article or HowTo structured data

**Content types by WordPress SEO performance:**

| Type | Word count | SEO power |
|------|-----------|-----------|
| Pillar / cornerstone | 2,000–4,000 | Highest (head keywords) |
| Tutorial / how-to | 800–1,500 | High (long-tail) |
| List post | 1,000–2,000 | Medium-high (shareable) |
| Update / news | 300–800 | Medium (time-sensitive) |
| FAQ | 500–1,200 | Medium (featured snippets) |
