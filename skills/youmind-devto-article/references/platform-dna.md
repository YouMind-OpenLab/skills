# Dev.to Platform DNA

> **Scope:** This file describes observable platform behavior — format constraints, discourse norms, community signals, and content patterns derived from Dev.to platform data and high-performing articles. It does NOT make claims about audience psychology, ethnicity, or cultural generalizations.

## Platform snapshot

- Built on Forem, so article rendering is Markdown + Liquid-embed centric rather than arbitrary HTML/CSS
- Feed discovery is heavily shaped by title, description, tags, cover image, and early community reactions
- Canonical URL is a first-class field, which makes Dev.to unusually friendly to cross-posting
- Series, organization profiles, and comments are all native distribution surfaces rather than afterthoughts
- Articles also function as profile proof: readers often evaluate the author through code quality, honesty, and reply behavior

## Format constraints

| Element | Constraint |
|---------|-----------|
| Title | No hard limit; **60–80 chars** optimal for SERP + social cards |
| Description | **≤170 chars**; meta description and social preview |
| Cover image | **1000×420** recommended; auto-cropped if off-ratio |
| Tags | **Maximum 4**; lowercase, alphanumeric + hyphens; max 30 chars/tag |
| Body | Markdown + Liquid embed tags |
| Code blocks | Language tag **required** (```typescript, ```python, etc.) |
| Series | First-class feature — ordered collection of posts |
| Canonical URL | First-class field for cross-posting (SEO attribution) |
| Word count | 800–2,500; engagement drops past 3,000 |
| Frontmatter | YAML: `title`, `published`, `description`, `tags`, `canonical_url`, `cover_image`, `series` |

### Liquid embed tags (Dev.to-specific)

```
{% tweet 1234567890 %}
{% codepen https://codepen.io/user/pen/xxxxx %}
{% youtube dQw4w9WgXcQ %}
{% github https://github.com/user/repo %}
{% gist https://gist.github.com/user/id %}
{% codesandbox xxxxx %}
{% stackblitz xxxxx %}
```

## Discourse norms (observable)

### Register

- **Technical but approachable.** "Explaining to a colleague" — not lecturing, not dumbing down
- First-person experience valued: "I built X and learned Y"
- Show, don't tell: code examples over theory
- Honest about limitations: "This works for X but not Y"
- No fluff: "In today's rapidly evolving tech landscape..." → readers leave

### Opening patterns

- **TL;DR first:** 2–3 sentences summarizing the article (Dev.to convention)
- **Problem hook:** "I needed X but every solution I found was..."
- **Question hook:** "Ever wondered why your bundle is 2MB when it should be 200KB?"
- **Ship narrative:** "I built X in a weekend. Here's everything I learned."
- **Code-first:** Open with a code snippet that shows the outcome, then explain how

### Closing patterns

- **Reaction CTA:** "If this helped, a ❤️ or 🦄 means a lot"
- **Follow prompt:** "I write about X every week"
- **Series next:** "Next in series: Part 3 — Advanced patterns"
- **Discussion invite:** "What's your approach? Let me know in the comments"

### Citation conventions

- Inline links to docs and repos
- Code blocks as primary evidence
- Canonical URL for cross-posts (strongly respected by Dev.to SEO)
- Benchmarks with methodology

### Self-promo tolerance

- **Moderate.** Sponsored posts are visually marked with a tag
- "Heavy ad copy → cold reception" — community pushback in comments
- `#discuss` tag for lower-promo conversational content
- Product launches OK if the article provides standalone technical value

## Moderation & flagging patterns

- **Community-moderated:** Flag system + moderator review
- **De-amplified:** Tag spam (unrelated popular tags), thin/low-effort posts
- **Flagged:** Plagiarism, harassment, spam
- **Community norms:** Constructive comments expected; toxicity rare but reported quickly
- **Gated-content backlash:** "Read the rest on my blog" teasers receive negative reactions

## Platform-native features to leverage

| Feature | When / why |
|---------|-----------|
| Series | Multi-part tutorials with ordering and navigation |
| Canonical URL | **ALWAYS** for cross-posts — Dev.to respects it for SEO |
| Cover image (1000×420) | Significantly increases engagement and feed visibility |
| Liquid embeds | Inline tweets, CodePens, YouTube, GitHub repos |
| Frontmatter | Full control: title, tags, series, canonical, published state |
| Reactions (❤️/🦄/bookmark) | Early engagement signals that influence whether a post keeps surfacing |
| `#discuss` tag | Conversational/opinion pieces with lower promo expectation |
| Organization profile | Company-branded dev blog hosted on Dev.to |
| Comments | Community engagement; authors expected to reply |

## Hard limits (must not violate)

- **4 tags maximum** per article
- Tags: lowercase only, alphanumeric + hyphens, 30 chars max per tag
- Description: ≤170 characters
- Code blocks without language tags: no syntax highlighting, looks unprofessional
- Cover image: 1000×420 auto-cropped; off-ratio may look odd
- Markdown only (no raw HTML beyond Liquid tags)
- No PDF embeds or file attachments

## Anti-patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Marketing language ("revolutionary", "game-changing") | Developers tune out immediately |
| Clickbait titles ("10 INSANE tricks...") | Credibility destroyed on sight |
| Wall of text without code | Dev.to readers scan for code first |
| Outdated dependencies/APIs | Broken examples = broken trust |
| No TL;DR | Busy developers skip the article entirely |
| Untagged code blocks | No syntax highlighting; amateur appearance |
| Tag spam (unrelated popular tags) | Flagged by moderators and community |
| Thin "Hello World" posts | No original value; invisible in feeds |
| Gated-content teasers | "Read the rest on my blog" → community pushback |
| "In today's rapidly evolving..." opener | Instant signal of AI-generated/low-effort content |

## Example calibration patterns

**High-engagement Dev.to article structure:**
1. Title: 60–80 chars, keyword-front-loaded, specific
2. Description: ≤170 chars, value proposition
3. Cover image: 1000×420, relevant
4. TL;DR: 2–3 sentences at top
5. Problem statement
6. Solution walkthrough: step-by-step with code
7. Working code example: complete, runnable
8. Results/benchmarks: proof it works
9. Gotchas/edge cases
10. Conclusion + reaction CTA
11. Tags: 3–4 from popular taxonomy

**Content type calibration:**

| Type | Typical fit |
|------|-------------|
| "How I built X" ship narrative | Strong |
| Deep-dive architecture | Strong |
| Tutorial with code | Strong |
| Performance optimization | Strong |
| Security / DevOps | Solid |
| Beginner guides | Situational |
| Opinion / #discuss | Situational |
| "Top N" listicle | Weak |

**Popular tag taxonomy:**
`javascript`, `typescript`, `python`, `webdev`, `react`, `node`, `tutorial`, `beginners`, `productivity`, `devops`, `database`, `testing`, `opensource`, `ai`, `rust`, `go`
