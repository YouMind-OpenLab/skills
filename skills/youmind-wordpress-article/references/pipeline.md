# WordPress Article Pipeline

## 7-Step Execution Flow

### Step 1: Load Config
- Read `config.yaml` for WordPress credentials and YouMind API key.
- Validate that `wordpress.site_url`, `wordpress.username`, and `wordpress.app_password` are set.
- If credentials are missing, prompt the user to configure them.

### Step 2: YouMind Knowledge Mining
- If YouMind API key is configured, mine the user's knowledge base for source material.
- Use `mineTopics()` with the user's topic keywords.
- Collect relevant articles, notes, and materials as research context.
- **Fallback:** Skip this step if YouMind is not configured. Continue with empty knowledge context.

### Step 3: Research
- Use YouMind web search to find current information on the topic.
- Combine knowledge base results with web search results.
- Build a research brief with key facts, statistics, and talking points.
- **Fallback:** Ask the user for manual input or proceed with available context.

### Step 4: Adapt Content Structure
- Determine the article structure based on topic and research.
- Plan headings, sections, and key arguments.
- Follow WordPress content adaptation rules (see `content-adaptation.md`).
- Select appropriate tags and categories.

### Step 5: Write Article
- Write the article in Markdown format.
- Include H1 title (50-70 chars for SEO).
- Write an excerpt (150-300 chars).
- Apply de-AI voice techniques for natural-sounding prose.
- Target word count: 1,000-3,000 words.

### Step 6: Publish
- Convert Markdown to HTML via `content-adapter.ts`.
- Resolve tag names to WordPress tag IDs (create new tags if needed).
- Resolve category names to existing WordPress category IDs.
- Upload featured image if provided.
- Create the post via WordPress REST API.
- Default status: `draft` (user can specify `--publish` for immediate publication).

### Step 7: Report
- Display the published post details:
  - Post ID
  - Title
  - URL
  - Status (draft/published)
  - Slug
  - Excerpt preview
- If YouMind is configured, optionally archive the article to YouMind knowledge base.

## Routing Shortcuts

- **User provides a specific topic:** Skip general research, go directly to topic-focused research.
- **User provides raw Markdown:** Skip Steps 2-5, go directly to Step 6 (publish).
- **User wants preview only:** Run Steps 2-5, then generate local HTML preview instead of publishing.

## Resilience

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty context |
| 3 Web research | Ask user for input |
| 6 Publishing | Generate local HTML preview |
| 7 Archiving | Warn, continue |
