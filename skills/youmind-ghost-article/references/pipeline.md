# Ghost Article Pipeline

## 7-Step Execution Flow

### Step 1: Load Config
- Read `config.yaml` for Ghost credentials and YouMind API key.
- Validate that `ghost.site_url` and `ghost.admin_api_key` are set.
- Validate API key format (must contain `:` separator with id and secret parts).
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
- Follow Ghost content adaptation rules (see `content-adaptation.md`).
- Select appropriate tags (first tag = primary tag for URL routing).
- Plan feature image if needed.

### Step 5: Write Article
- Write the article in Markdown format.
- Write with an editorial tone (Ghost's audience expects curated, magazine-quality content).
- Write the custom excerpt (150-300 chars) — this drives newsletter open rates.
- Optimize for both web reading and email newsletter rendering.
- Keep paragraphs short and scannable.
- Target word count: 800-2,500 words.

### Step 6: Publish
- Convert Markdown to HTML via `content-adapter.ts`.
- Build tag objects (Ghost creates tags automatically if they don't exist).
- Upload feature image if provided.
- Generate JWT token for API authentication.
- Create the post via Ghost Admin API with `?source=html`.
- Default status: `draft` (user can specify `--publish` for immediate publication).
- Note: publishing with `published` status may also send the post as a newsletter email if the Ghost site has email enabled.

### Step 7: Report
- Display the published post details:
  - Post ID
  - Title
  - URL
  - Status (draft/published/scheduled)
  - Slug
  - Excerpt preview
  - Primary tag
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
