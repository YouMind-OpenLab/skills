# Dev.to Content Adaptation Guide

Rules for writing articles that resonate with the Dev.to developer audience.

## Target Audience

- Software developers (junior to senior)
- Open source contributors
- DevOps engineers, SREs
- Technical leads and engineering managers
- Developer advocates and educators

## Title Rules

- **Length:** 60-80 characters (searchable, fits in social cards)
- **Keyword-front-loaded:** Put the main technology/concept first
- **Format:** "[Technology]: [What You'll Learn]" or "[Action verb] [Specific Thing] with [Technology]"

**Good titles:**
- "TypeScript Generics: A Practical Guide to Type-Safe Utility Functions"
- "Building a CLI Tool with Node.js and Commander in Under 100 Lines"
- "PostgreSQL Query Optimization: 5 Index Strategies That Actually Work"

**Bad titles:**
- "You Won't Believe These Amazing TypeScript Tricks!" (clickbait)
- "My Journey Into Coding" (too vague)
- "Things Every Developer Should Know About Databases" (listicle bait)

## Article Structure

Follow the **Problem -- Solution -- Code -- Result** pattern:

1. **TL;DR** (2-3 sentences at the top)
2. **Problem statement** (what challenge are we solving?)
3. **Context/Background** (brief, only what's needed)
4. **Solution walkthrough** (step-by-step with code)
5. **Working code example** (complete, runnable)
6. **Results/Benchmarks** (proof it works)
7. **Gotchas/Edge cases** (what to watch out for)
8. **Conclusion** (summary + next steps)

## Code Block Rules

- Every code block MUST have a language tag: \`\`\`typescript, \`\`\`python, \`\`\`bash, etc.
- Code must be runnable or clearly marked as pseudocode
- Include comments for non-obvious lines
- Show both the code and its output when relevant
- Keep individual blocks under 40 lines; split longer code into steps

## Tags

- **Maximum 4 tags** per article
- Tags must be **lowercase**, **alphanumeric + hyphens** only
- Max 30 characters per tag
- Use existing popular tags: `javascript`, `typescript`, `python`, `webdev`, `react`, `node`, `tutorial`, `beginners`, `productivity`, `devops`, `database`, `testing`, `opensource`
- First tag appears as the article's "category" -- choose it carefully

## Description

- **Max 170 characters** (used for SEO meta description and social previews)
- Should summarize the article's value proposition
- Include the primary keyword

## Tone and Voice

- **Technical but approachable:** Write like explaining to a colleague, not lecturing
- **Show, don't tell:** Code examples over theory
- **Honest about limitations:** "This approach works well for X but not Y"
- **First-person is OK:** "I ran into this issue..." builds trust
- **Skip the fluff:** No "In today's rapidly evolving tech landscape..."

## Anti-Patterns (Never Do These)

| Anti-pattern | Why it fails | Fix |
|-------------|-------------|-----|
| Marketing language ("revolutionary", "game-changing") | Developers tune out | State the technical benefit directly |
| Clickbait titles ("10 INSANE tricks...") | Loses credibility | Be specific about what the reader will learn |
| Wall of text without code | Dev.to readers scan for code first | Lead with a code example |
| Outdated dependencies/APIs | Broken examples destroy trust | Verify all code works with current versions |
| No TL;DR | Busy developers skip the article | Always start with a 2-3 sentence summary |
| Untagged code blocks | Looks unprofessional, no syntax highlighting | Always specify the language |

## Word Count Guidelines

| Type | Word count | When to use |
|------|-----------|-------------|
| Quick tip | 300-600 | Single trick or technique |
| Tutorial | 800-1500 | Step-by-step guide |
| Deep dive | 1500-2500 | Architecture, analysis, comparison |
| Series part | 800-1200 | Part of a multi-article series |

## Cover Image

- Not required but improves engagement significantly
- Recommended size: 1000x420 pixels
- Keep text minimal on the image
- Use a relevant screenshot, diagram, or clean graphic
- Avoid stock photos with "business people pointing at screens"

## Cross-Posting

If cross-posting from your blog:
- Set `canonical_url` to the original post URL
- This tells search engines which version is the original
- Dev.to respects canonical URLs in their SEO
