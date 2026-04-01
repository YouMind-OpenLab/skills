# Medium Content Adaptation Guide

Rules for writing articles that resonate with the Medium audience.

## Target Audience

- General readers and lifelong learners
- Thought leaders and industry professionals
- Tech/business/startup community
- Writers and content creators
- Self-improvement and productivity enthusiasts

## Title Rules

- **Length:** 60-100 characters (compelling, fits in social cards and email digests)
- **Style:** Narrative, curiosity-driven, promise of insight
- **Format:** "[Insight/Story Hook]: [What the Reader Gets]" or "What [Experience] Taught Me About [Topic]"

**Good titles:**
- "The Unexpected Lesson I Learned From Building My First AI Product"
- "Why Most Productivity Advice Fails -- and What Actually Works"
- "A Developer's Guide to Writing That People Actually Want to Read"

**Bad titles:**
- "10 AMAZING Tips for Productivity!!!" (clickbait)
- "Technical Deep Dive Into React Server Components" (too dry for Medium)
- "My Thoughts on Things" (too vague)

## Article Structure

Medium rewards narrative depth. Follow this general structure:

1. **Opening hook** (1-2 paragraphs) -- a story, surprising fact, provocative question, or bold statement
2. **Context** -- set up the problem or situation (brief)
3. **Main body** -- unfold the narrative with clear sections
4. **Supporting evidence** -- examples, data, personal experience
5. **Key insight** -- the "aha moment" the reader came for
6. **Conclusion** -- takeaway, call to reflection, or forward-looking thought

## Formatting Best Practices

- **Short paragraphs:** 2-4 sentences max. Medium readers scan on mobile.
- **Subheadings:** Break content every 3-5 paragraphs with H2 or H3.
- **Blockquotes:** Use for emphasis, key quotes, or highlighted takeaways.
- **Bold text:** Sparingly, for key phrases only.
- **Code blocks:** Supported in Markdown format. Use for technical articles.
- **Images:** Reference by URL. Medium will host them. Use for visual breaks.
- **Lists:** Use sparingly. Medium is not a listicle platform -- prefer narrative.

## Tags

- **Maximum 5 tags** per article
- Tags are broad categories: `technology`, `programming`, `artificial-intelligence`, `productivity`, `self-improvement`, `startup`, `design`, `writing`, `leadership`, `data-science`
- First tag is the primary category -- choose it carefully
- Tags affect Medium's distribution algorithm
- Use existing popular tags for discoverability

## Tone and Voice

- **Personal and authentic:** Write in first person. Share real experience.
- **Narrative-driven:** Tell stories, not just state facts.
- **Polished but approachable:** Well-crafted sentences without being stiff.
- **Opinionated:** Take a stance. "I believe..." is stronger than "Some people think..."
- **Conversational:** Write like talking to a smart friend over coffee.
- **Vulnerable when appropriate:** Admitting mistakes and sharing lessons builds trust.

## Anti-Patterns (Never Do These)

| Anti-pattern | Why it fails | Fix |
|-------------|-------------|-----|
| Clickbait titles ("You won't believe...") | Erodes trust, Medium may suppress | Be compelling but honest |
| Thin content (under 500 words) | Doesn't provide enough value | Aim for 800-2500 words |
| Corporate/marketing language | Readers came for authentic voices | Write like a person, not a brand |
| Excessive self-promotion | Medium readers want insight, not ads | Provide value first, promote subtly |
| Wall of text without breaks | Mobile readers will bounce | Short paragraphs, subheadings, whitespace |
| Pure listicle format | Medium favors narrative depth | Use stories and examples instead of numbered lists |
| No personal angle | Feels generic and AI-generated | Share your specific experience or perspective |

## Word Count Guidelines

| Type | Word count | When to use |
|------|-----------|-------------|
| Quick insight | 500-800 | Single focused idea or lesson |
| Standard article | 800-1500 | Most articles, stories, tutorials |
| Deep dive | 1500-2500 | Complex topics, long-form narrative |
| Series part | 800-1200 | Part of a multi-part series |

## SEO and Distribution

- Medium has its own internal distribution algorithm (not traditional SEO)
- Quality signals: read ratio (time spent reading vs. article length), claps, highlights
- External sharing (Twitter/X, LinkedIn) boosts Medium distribution
- Cross-posting: Set `canonicalUrl` to your original post URL if applicable
- Subtitles: Medium supports subtitles -- use them to complement the title

## Cross-Posting

If cross-posting from your blog:
- Set `canonicalUrl` to the original post URL
- This tells search engines which version is the original
- Medium respects canonical URLs
- You can also publish to a Medium publication for broader reach

## Publication Publishing

- Publishing to a publication can increase reach significantly
- The user must be listed as a writer for the publication
- Use the `publication_id` in config or `--publication` CLI flag
- Articles submitted to publications may go through editorial review
