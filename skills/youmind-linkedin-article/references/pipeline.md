# LinkedIn Pipeline Execution Detail

> Read this file when running the full writing pipeline (Steps 1–8).

---

## Step 1: Load Client Configuration

Read `{skill_dir}/clients/{client}/style.yaml` if it exists.

**Routing:**
- User specified Post or Article → set mode accordingly
- User gave a topic → Skip Steps 2–3, go to 1.5 → 3.5
- User gave raw Markdown → Skip to Step 7

## Step 1.5: Content Type Decision + Knowledge Mining

**Content type decision:**
- If user specified → use that
- If content exists and ≤1500 chars → Post
- If content exists and >1500 chars → Article
- If no content yet → Ask user or default to Post for engagement topics, Article for analysis topics

**Knowledge mining (if YouMind API key configured):**
Use `youmind-api.js mine-topics` with target topics. Keep top 10 results as `knowledge_context`.

**[Fallback]:** API error → skip, empty knowledge_context.

## Step 2: LinkedIn Trending Analysis

Use YouMind web-search to find trending LinkedIn topics in the user's industry.
Focus on: industry news, thought leadership trends, viral post patterns.

**[Fallback]:** Web search fails → ask user for topic direction.

## Step 2.5: Dedup + Trend Scoring

Check `history.yaml` for recently published topics. Score by: relevance, timeliness, audience interest, uniqueness of angle.

## Step 3: Topic Generation

Generate **10 topic ideas**. For each:
- Title / hook line
- Core insight
- Target audience reaction ("they'll think/feel/do...")
- Recommended content type (Post or Article)
- Hashtag preview (3–5 tags)

**Auto mode:** Select highest scorer.
**Interactive mode:** Present all 10.

## Step 3.5: Framework Selection

Read `references/frameworks.md`. Choose based on content type:

**For Posts:**
- Hook → Story → Insight → CTA
- Hook → List → Takeaway
- Contrarian take → Evidence → Invitation

**For Articles:**
- Problem → Analysis → Solution → CTA
- Narrative → Framework → Application
- Trend → Deep dive → Predictions

## Step 4: Writing

Read `references/writing-guide.md`.

**Post-specific rules:**
- ≤3000 characters (hard limit). Sweet spot: 1200–1500
- First 2 lines are CRITICAL (LinkedIn truncates with "...see more")
- Short paragraphs (1–3 sentences). One idea per paragraph.
- Strategic line breaks for visual breathing room
- End with engagement hook

**Article-specific rules:**
- No hard character limit, but 800–2000 words optimal
- H1 becomes article title (20–60 chars)
- Use subheadings for scannability
- Include data, examples, and visuals
- Professional but not stiff

Save to: `{skill_dir}/output/{client}/{YYYY-MM-DD}-{slug}.md`

## Step 5: Optimization

1. **Hashtag strategy:** Read `references/hashtag-strategy.md`. Select 3–5 hashtags.
2. **Hook refinement:** Generate 3 alternative first lines, pick the most compelling.
3. **De-AI pass:** Remove corporate buzzwords and AI-sounding phrases.
4. **CTA check:** Ensure the ending invites engagement.
5. **Length check:** Post ≤3000 chars. Article reasonable length.

## Step 6: Visual AI

Read `references/visual-prompts.md`.

**For Posts:** Single image attachment (optional but boosts reach 2–3x).
**For Articles:** Cover image + 2–4 inline images.

**[Fallback]:** Image generation fails → publish without images.

## Step 7: Publish to LinkedIn

**Post:** Use `cli.js publish-post` with `--hashtags`.
**Article:** Use `cli.js publish-article` with optional `--cover`.

**[Fallback]:** Publish fails → save as local HTML/text preview.

## Step 7.5: History + Archive

Append to `clients/{client}/history.yaml`: date, title, type (post/article), post_urn, post_url.

## Step 8: Final Output

Report: title, content type, URL, hashtags, character count, engagement prediction.
