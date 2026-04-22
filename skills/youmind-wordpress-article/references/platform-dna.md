# WordPress Platform DNA

> **Scope:** This file describes observable platform behavior from official WordPress editor, support, and REST API documentation: post fields, taxonomy, excerpt/featured-image behavior, scheduling, revisions, and site-level SEO conventions. It does NOT make claims about audience psychology or broad market stereotypes.

## Platform snapshot (2026)

- WordPress is a **site CMS and publishing system**, not a feed algorithm or community network
- A post is not just "body HTML" — it lives inside a larger object with:
  - `title`
  - `slug`
  - `excerpt`
  - `featured_media`
  - `status`
  - `categories`
  - `tags`
  - `template`
  - optional `meta`
- The editor stores **revisions** and **autosaves**
- Posts can be **scheduled** for future publication
- Final presentation is affected by the **theme** and, on modern sites, the **block editor / template system**

If a draft only thinks about the body copy and ignores taxonomy, excerpt, featured image, and post status, it is not yet WordPress-native.

## Product surfaces that matter

WordPress posts typically have to work across several surfaces:

1. **Editor surface** — title, excerpt, featured image, category/tag settings, scheduling, revisions
2. **Theme surface** — post template, archive cards, search results, homepage modules
3. **Search surface** — title, slug, excerpt/meta description, headings, links, structured content
4. **Social preview surface** — featured image + title + excerpt
5. **Site navigation surface** — categories, tags, related posts, internal links

Strong WordPress content is written for these surfaces together, not just for the raw article body.

## Format constraints

| Element | Constraint |
|---------|-----------|
| Title | Working sweet spot **50–65 chars** for search/share readability |
| Slug | Separate post field; keep it short, stable, lowercase-hyphenated |
| Excerpt | Separate summary field; if omitted, WordPress can fall back to the first **55 words** |
| Featured image | Theme-dependent presentation; **1200×630** remains a safe social-preview default |
| Categories | Hierarchical taxonomy; structure and navigation matter |
| Tags | Flat taxonomy; optional, but useful for grouping/discovery |
| Body | Usually block-editor content rendered as HTML |
| Headings | H1 should remain the post title; use H2/H3 in the body |
| Status | REST API supports `publish`, `future`, `draft`, `pending`, `private` |
| Password | Optional per-post protection exists in the REST schema |
| Template | Posts can declare a theme template in the REST schema |

## Discourse norms (observable)

### Register

- **Site-native.** The voice should match the site or publication, not an imagined WordPress community
- **Search-legible.** Readers often arrive from search or archive pages and need a fast orientation
- **Structured and scannable.** Headings, lists, callouts, and concise paragraphs are rewarded by the medium
- **Practical over ornamental.** WordPress articles usually perform best when they solve or explain something clearly

### Opening patterns

- direct problem framing
- answer-preview opening
- key term in the first paragraph when search visibility matters
- immediate clarification of who the article is for

### Closing patterns

- CTA to read related posts, subscribe, download, comment, or convert
- internal link block or related resource suggestion
- brief summary / next step section

### Citation conventions

- inline links are standard
- internal links are valuable because WordPress is site-navigation-heavy
- authority links matter when the article makes claims that need trust support

### Self-promo tolerance

- High, because the site owner controls the environment
- But site quality still depends on usefulness, trust, and clear structure
- Search-oriented sites especially suffer when content is thin, repetitive, or obviously keyword-stuffed

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Excerpt field | Summary for archives, cards, search/share contexts, RSS-like surfaces |
| Featured image | Used in blog listings, search results, and social previews depending on theme |
| Categories | Hierarchical organization and archive routing |
| Tags | Optional grouping and discovery aid |
| Schedule / future status | Editorial cadence and staged publishing |
| Revisions | Safe drafting, recovery, and update workflows |
| Block editor | Cleaner structure via headings, media, callouts, tables, code blocks |
| Template field | Matters on sites with multiple post templates |
| Sticky posts | Useful for pinned editorial pieces |
| Password/private status | Useful for controlled-access previews or internal posts |

## SEO plugin rubric (Yoast / RankMath style)

These are not WordPress core laws, but they are the de facto publishing rubric on many serious WordPress sites:

| Check | Typical requirement |
|-------|---------------------|
| Focus keyphrase | In title, first paragraph, URL, and at least one section heading |
| Meta/excerpt quality | Short, complete, useful, non-duplicative |
| Internal links | At least one meaningful internal link |
| Outbound links | At least one useful authority link when claims need support |
| Alt text | Required on images for accessibility and often SEO workflows |
| Heading hierarchy | Single H1 via title, then H2/H3 structure |
| Readability | Short paragraphs, transition words, low clutter |
| Thin content check | The post must be substantial enough for its query/goal |

## Hard limits (must not violate)

- H1 belongs to the post title; do not duplicate it in the body
- Theme rendering varies; block-heavy or complex layouts may display differently across themes
- The REST API expects concrete post fields like `slug`, `excerpt`, `featured_media`, `status`, `categories`, and `tags`
- Categories are hierarchical and tags are flat; they should not be used interchangeably
- Featured-image presentation is theme-controlled, so one image may behave differently across sites
- Revisions and scheduling are first-class features; changing publish timing should be deliberate

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Treating WordPress as "HTML only" | Misses excerpt, featured image, taxonomy, status, and template surfaces |
| Multiple H1 headings | Breaks document hierarchy and common SEO expectations |
| No excerpt | Archive/search/social summary becomes weak or auto-generated |
| No featured image | Cards and previews often look incomplete |
| Categories used like tags | Damages site structure and archive quality |
| Keyword-stuffed headings | Looks artificial and hurts readability |
| No internal linking plan | Misses WordPress's site-navigation advantage |
| Ignoring revisions/scheduling | Weak editorial workflow and update safety |
| Theme-dependent layout assumptions | Breaks across templates or blocks |

## Example calibration patterns

**Strong WordPress post structure:**
1. Clear title
2. Short slug
3. Intentional excerpt
4. Featured image chosen for cards/social
5. First paragraph that explains the problem and payoff
6. H2-led body with scannable sections
7. Internal links and at least one authority link where useful
8. Categories and tags chosen intentionally
9. Draft / future / publish state selected deliberately

**Best-fit content types:**

| Type | Why it fits WordPress |
|------|------------------------|
| SEO tutorials | Search + archive + internal-link strengths |
| Evergreen explainers | Strong fit for site-owned long-form content |
| Company blog posts | Matches owned-brand publishing |
| Documentation-lite guides | Block editor + taxonomy + revisions help a lot |
| List posts / FAQs | Structured, scannable, archive-friendly |
