# WordPress Article Pipeline

## 7-Step Execution Flow

### Step 1: Load Config
- Read `~/.youmind/config.yaml` for the YouMind API key (`youmind.api_key`) and `youmind.base_url`.
- Validate the YouMind API key (call `validate` command or attempt a list).
- Check that the user's WordPress site is already connected inside YouMind. The skill no longer reads `wordpress.site_url` / `wordpress.username` / `wordpress.app_password` locally — those live encrypted in YouMind after the user links their site at [YouMind Connector Settings](https://youmind.com/settings/connector).
- If the YouMind API key is missing, prompt the user to fill `youmind.api_key`. If WordPress is not connected in YouMind, point them to the connector page.

**Configuration rule:** Read `youmind.api_key` and `youmind.base_url` from `~/.youmind/config.yaml`, plus optional skill-specific overrides in `~/.youmind/config/youmind-wordpress-article.yaml`. Keep documentation and examples on `https://youmind.com/openapi/v1`; local backend debugging should only change those `~/.youmind` files.

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
- Resolve tag names to WordPress tag IDs (create new tags if needed) through the YouMind `/wordpress/*` OpenAPI proxy.
- Resolve category names to existing WordPress category IDs through the same proxy.
- Upload featured image if provided.
- Create the post through the YouMind WordPress OpenAPI (YouMind attaches the stored credentials when proxying to the user's site).
- Default status: `draft` (user can specify `--publish` for immediate publication).

**Fallback:** If YouMind proxy publishing fails, save the adapted Markdown/HTML locally so the user can paste it into WordPress Admin.

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
