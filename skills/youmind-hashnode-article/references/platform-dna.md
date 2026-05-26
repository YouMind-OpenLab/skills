# Hashnode Platform DNA

> **Scope:** This file describes observable platform behavior — format constraints, discourse norms, community signals, and content patterns derived from Hashnode platform data and high-performing articles. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations.

## Platform snapshot

- Positioning: developer-owned publication with built-in discovery, not a general-purpose CMS
- Differentiator: custom domain support paired with Hashnode distribution, so posts must work for both owned-site SEO and native feed discovery
- Deep technical posts are the clearest platform fit: subtitle, cover image, canonical URL, series, and code-block enrichment all matter
- Table of contents, newsletter collection, and tag pages are meaningful product surfaces, not cosmetic extras
- The platform rewards depth, implementation detail, and navigable multi-part writing more than posting frequency

## Format constraints

| Element | Constraint |
|---------|-----------|
| Title | No hard limit; **~70 chars** typical for technical depth signaling |
| Subtitle | Supported; appears below title in post header |
| Cover image | **1600×840** recommended; required for "featured" placement |
| Cover alt-text | Supported (accessibility + SEO) |
| Body | Markdown (GFM superset) with safe HTML subset |
| Code blocks | Language tag + filename + line highlight: ` ```ts:src/handler.ts {3-5} ` |
| Tags | Up to 5; from Hashnode taxonomy (tag pages have dedicated audience) |
| Series | First-class feature — named series with ordered posts and navigation |
| Canonical URL | First-class field — critical for cross-posting without SEO penalty |
| Slug | Customizable; stable once published |
| SEO metadata | Title, description, OG image all configurable per post |
| Word count | **1,500–3,000** typical; deep-dive expected by the audience |

## Discourse norms (observable)

### Register

- **Technical professional:** More thorough and formal than Dev.to, less editorial than Ghost
- Code-first: readers expect substantial code examples, architecture diagrams, benchmarks
- "How it works under the hood" is the signature Hashnode content type
- Hashnode rewards depth and quality over posting frequency
- Tutorial depth expected: problem → approach → implementation → results → gotchas

### Opening patterns

- **Problem with real numbers:** "Our API was timing out at 3s. Here's how we got it to 200ms."
- **Concept definition + why it matters:** "Zero-copy deserialization eliminates 40% of memory overhead."
- **Scenario intro:** "You're building a CLI tool and need structured error handling."
- **Series context:** "Part 3 of my deep-dive into Rust's type system."

### Closing patterns

- **TL;DR / Summary:** Bullet points recapping key insights
- **Resources list:** Links to repos, docs, related articles
- **Series navigation:** "Next: Part 4 — Lifetimes and Borrowing"
- **Discussion prompt:** "What's your approach to X? Let me know in the comments."

### Citation conventions

- Inline links to official docs and GitHub repos
- Code repository links as primary evidence
- Benchmark data with methodology
- Canonical URL for cross-posted content (Hashnode's strongest SEO feature)

### Self-promo tolerance

- **Low-medium.** Product placement OK if the product solves the article's problem
- Dev tools with technical depth: acceptable
- "Build in public" updates for developer tools: acceptable
- Marketing without technical content: low engagement, won't surface

## Moderation & flagging patterns

- Community reporting system, but lighter moderation than Dev.to
- Quality enforcement primarily through feed algorithm (depth + engagement = visibility)
- Low-quality posts simply don't surface in discovery feeds
- Plagiarism detection exists
- No public downvoting; quality is expressed through lack of engagement rather than negative signals

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Series | Multi-part tutorials, progressive deep-dives with navigation |
| Canonical URL | **ALWAYS** for cross-posts — Hashnode's killer SEO feature |
| Cover image (1600×840) | **ALWAYS** — required for featured placement |
| Subtitle | Expand on title with secondary hook or context |
| Tags (up to 5) | Tag pages have dedicated audiences; choose from taxonomy |
| Table of Contents | Auto-generated for long posts |
| Code blocks with filename | Show file context: ` ```ts:src/handler.ts ` |
| Custom domain | Blog-as-personal-brand (myblog.dev → Hashnode) |
| Newsletter integration | Built-in subscriber collection for developer-owned blogs |
| OG meta customization | Control social sharing appearance precisely |

## Hard limits (must not violate)

- 5 tags maximum per post
- Markdown with safe HTML subset — no arbitrary HTML/CSS injection
- Cover image required for "featured" placement on Hashnode feed
- Series ordering is manual — must explicitly set post position
- Canonical URL must match exact origin URL (trailing slash matters for SEO)
- Code blocks without language tags: no syntax highlighting

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Shallow summaries | Hashnode audience expects depth; surface-level content gets no engagement |
| Broken code blocks | Syntax errors destroy credibility with this technical audience |
| Missing tags | Post is invisible in tag feeds where Hashnode's audience browses |
| Clickbait without technical substance | Readers click for depth; finding fluff = immediate bounce |
| No canonical URL on cross-posts | Duplicate content SEO penalty for both the original and Hashnode |
| Short posts (< 800 words) | Below Hashnode's depth threshold; unlikely to surface in feeds |
| No cover image | Won't appear in featured feeds or generate proper social cards |
| Code without filename context | Readers can't tell which file the snippet belongs to |

## Example calibration patterns

**High-engagement Hashnode post structure:**
1. Title: ~70 chars, specific technical topic
2. Subtitle: Context or secondary hook
3. Cover image: 1600×840, clean, relevant
4. Opening: Problem with real numbers or scenario
5. Body: H2 sections (3–5), code blocks with filenames, diagrams
6. Benchmarks/results: Data-driven proof
7. Gotchas section: Real pitfalls from hands-on experience
8. Summary: TL;DR bullets
9. Resources: Links to repos, docs
10. Tags: 3–5 from Hashnode taxonomy
11. Series: If part of multi-article sequence
12. Canonical URL: If cross-posted from another site

**Word count calibration:**

| Type | Length |
|------|--------|
| Tutorial | 1,000–1,500 words |
| Deep dive | 1,500–3,000 words |
| Architecture / system design | 2,000–4,000 words |
| Series part | 1,000–1,500 words |
| Quick tip (rare on Hashnode) | 500–800 words |
