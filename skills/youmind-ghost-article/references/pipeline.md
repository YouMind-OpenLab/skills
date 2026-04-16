# Ghost Article Pipeline

## 7-Step Execution Flow

### Step 1: Load Config

- Read `~/.youmind/config.yaml` for `youmind.api_key`
- Validate that a YouMind API key is present
- Call YouMind Ghost OpenAPI `validateConnection`
- If Ghost is not connected, surface the connector URL from the API response
- If the current plan is not eligible, surface the upgrade URL from the API response

### Step 2: YouMind Knowledge Mining

- If the user asks for topic exploration, mine the user's knowledge base for source material
- Use YouMind search / material lookup to collect relevant articles, notes, and materials
- **Fallback:** Skip this step if the user already provided the content or topic context is sufficient

### Step 3: Research

- Use YouMind web search to gather current context on the topic
- Combine knowledge base results with web search results
- Build a research brief with key facts, statistics, and talking points
- **Fallback:** Ask the user for manual input or proceed with the available context

### Step 4: Adapt Content Structure

- Determine the article structure based on topic and research
- Plan headings, sections, and key arguments
- Follow Ghost content adaptation rules from `content-adaptation.md`
- Select tags and plan the feature image

### Step 5: Write Article

- Write the article in Markdown
- Write with an editorial tone that works on both the Ghost site and Ghost newsletters
- Write the custom excerpt
- Keep paragraphs short and scannable

### Step 6: Publish

- Convert Markdown to HTML via `content-adapter.ts`
- Upload the feature image if provided
- Call YouMind Ghost OpenAPI `createPost`
- Default status is `draft`
- If the user wants the post live immediately, use `published` or `publishPost`
- When a post is draft or scheduled, return the Ghost Admin URL so the user can review it in Ghost Admin

### Step 7: Report

- Display the resulting post details:
  - Post ID
  - Title
  - Status (`draft` / `published` / `scheduled`)
  - Public URL
  - Ghost Admin URL
  - Slug
  - Excerpt preview
- If YouMind article archiving is part of the flow, archive after publishing or draft creation

## Routing Shortcuts

- **User provides a specific topic:** Skip broad research and go directly to topic-focused research
- **User provides raw Markdown:** Skip Steps 2-5 and go directly to Step 6
- **User wants preview only:** Run local conversion and generate HTML preview instead of publishing
- **User wants to manage an existing post:** Use `getPost`, `listDrafts`, `listPublished`, `publishPost`, or `unpublishPost`

## Resilience

| Step | Fallback |
|------|----------|
| 2 Knowledge mining | Skip, empty context |
| 3 Research | Ask user for input |
| 6 Publishing | Generate local HTML preview |
| 7 Archiving | Warn, continue |
