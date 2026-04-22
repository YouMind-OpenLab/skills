# Hashnode Content Adaptation Guide

Rules for writing SEO-optimized articles for Hashnode publications.

## Target Audience

- Software developers (all levels)
- DevOps and cloud engineers
- Technical bloggers and content creators
- Startup founders and CTOs
- Developer advocates

## Title Rules

- **Length:** 50-70 characters (optimal for SEO and social cards)
- **Keyword-front-loaded:** Put the main technology/concept first
- **SEO-aware:** Include the primary search keyword naturally

**Good titles:**
- "GraphQL Subscriptions: Real-Time Data in 50 Lines of Code"
- "Rust Lifetimes Explained with Practical Examples"
- "Docker Multi-Stage Builds: Cut Your Image Size by 80%"

**Bad titles:**
- "My Thoughts on Programming" (too vague, no keyword)
- "The Ultimate Guide to Everything in Web Dev" (too broad)
- "AMAZING 10 TRICKS..." (clickbait)

## Subtitle

Hashnode prominently displays subtitles below the title. This is valuable real estate.

- **Purpose:** Hook the reader, expand on the title's promise
- **Length:** 50-150 characters
- **Tone:** Complement the title, add specificity
- **Examples:**
  - Title: "PostgreSQL vs MySQL in 2024" / Subtitle: "Performance benchmarks, feature comparison, and when to choose which"
  - Title: "Building a Rate Limiter in Go" / Subtitle: "Token bucket algorithm with Redis, tested at 100K req/s"

## Article Structure

1. **Opening paragraph** (hook + what the reader will learn)
2. **Prerequisites** (if tutorial)
3. **Main content** with H2/H3 hierarchy
4. **Code examples** with language tags
5. **Results/benchmarks** (if applicable)
6. **Conclusion** (summary + call to action)
7. **Resources** (links to docs, repos, related articles)

## SEO Best Practices

- **Meta description:** Max 160 characters, include primary keyword
- **Headings:** Use H2 for main sections, H3 for subsections (Hashnode generates TOC from these)
- **Internal links:** Link to your other Hashnode posts where relevant
- **External links:** Link to official docs and authoritative sources
- **Image alt text:** Describe images for accessibility and SEO
- **URL slug:** Hashnode auto-generates from title, but you can customize

## Tags

- **Maximum 5 tags** per article
- Use existing Hashnode tags (search with `search-tags` command)
- Common tags: `javascript`, `typescript`, `python`, `go`, `rust`, `react`, `nodejs`, `web-development`, `devops`, `cloud`, `database`, `tutorial`, `beginners`, `programming`
- First tag is the primary category

## Cover Image

- **Recommended size:** 1600x840 pixels
- **Format:** URL (Hashnode hosts via Cloudinary)
- Use clean graphics, diagrams, or screenshots
- Avoid generic stock photos
- Include minimal text (title or key concept)
- Dark backgrounds work well for tech content

## Code Block Rules

- Every code block must have a language tag
- Keep blocks under 40 lines; split longer code
- Include comments for non-obvious logic
- Show output/results after code when relevant
- Use `diff` language tag to highlight changes

## Cross-Posting / Canonical URL

When republishing content from your personal blog:
- **Always set `canonical_url`** to the original post URL
- This prevents SEO duplicate content penalties
- Hashnode respects canonical URLs
- The original blog keeps SEO authority

## Series Support

For multi-part content:
- Create a series in Hashnode dashboard first
- Use the series ID when publishing
- Name series descriptively: "Building a Compiler in Rust" not "My Series"
- Each part should be standalone-readable but reference the series

## Tone and Voice

- **Professional but personable:** Write with authority but approachability
- **Show expertise through depth:** Not through jargon
- **Use "we" or "I":** Personal voice builds readership
- **Be opinionated:** Take a stance, back it with evidence
- **No fluff:** Skip "In today's fast-paced world..." intros

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|-------------|-------------|-----|
| SEO keyword stuffing | Reads unnaturally, Google penalizes | Use keywords naturally, 1-2% density |
| Missing subtitle | Wastes Hashnode's prominent subtitle display | Always write a compelling subtitle |
| No canonical URL on cross-posts | Duplicate content hurts SEO | Always set canonical_url |
| Generic cover images | Low click-through rate | Create custom graphics or use relevant screenshots |
| Walls of text | Readers bounce | Break up with code, images, headings |
| Outdated information | Erodes trust | Date-stamp claims, verify currency |

## Word Count Guidelines

| Type | Word count | When to use |
|------|-----------|-------------|
| Quick tip | 400-700 | Single technique or tool |
| Tutorial | 1000-2000 | Step-by-step guide |
| Deep dive | 2000-3000 | Architecture, comparison, analysis |
| Series part | 1000-1500 | Part of multi-article series |
