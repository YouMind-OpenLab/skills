# Medium Article Pipeline

7-step execution pipeline from topic to published article.

## Step 1: Config Load

1. Read `config.yaml` for API keys
2. Validate Medium integration token (call `validate` command to get user info)
3. Check YouMind API key availability (optional)
4. Report config status

**Fallback:** If config.yaml missing, check environment variables (`MEDIUM_TOKEN`, `YOUMIND_API_KEY`).

## Step 2: YouMind Knowledge Mining

1. If YouMind API key is configured, search user's knowledge base for relevant materials
2. Use `youmind-api.ts mine-topics` with the user's topic keywords
3. Collect relevant articles, notes, and documents as source material
4. Build a knowledge context summary

**Fallback:** If YouMind not configured or fails, skip with empty knowledge context. The article can still be written.

## Step 3: Research

1. Use YouMind web search to find current information about the topic
2. Search for related Medium articles to understand existing coverage
3. Identify unique angles not covered by top results
4. Collect stories, examples, data points, and quotes

**Fallback:** If web search fails, ask user to provide key points or references.

## Step 4: Content Adaptation

Read `content-adaptation.md` before this step.

1. Choose article structure (narrative essay, tutorial, opinion piece, case study)
2. Craft a compelling title (60-100 chars, curiosity-driven)
3. Select up to 5 tags from Medium's popular categories
4. Plan the opening hook (story, question, or bold statement)
5. Decide on publish status (draft, public, or unlisted)
6. Determine whether to publish to user profile or a publication

## Step 5: Write

1. Write the opening hook (1-2 paragraphs, must grab attention)
2. Develop the narrative following the adapted structure
3. Keep paragraphs short (2-4 sentences)
4. Use subheadings every 3-5 paragraphs
5. Include personal voice and authentic perspective
6. Write a compelling conclusion with a takeaway

**Quality checks:**
- Strong opening hook (no "In today's world...")
- Personal voice throughout
- Short paragraphs for mobile readability
- Subheadings break up the content
- Tags are valid (max 5, broad categories)
- Title is 60-100 characters, compelling but not clickbait
- Word count: 800-2500

## Step 6: Publish

1. Run `cli.ts publish` with the markdown file
2. Default to draft mode (`publishStatus: "draft"`) unless user explicitly requests public or unlisted
3. Include tags, canonical URL, and publication ID if provided
4. Use Markdown content format (default)
5. Report article ID, URL, and status

**Important:** Medium API is publish-only. Once created, articles cannot be updated or deleted via API. Edits must be made through the Medium web interface.

**Fallback:** If Medium API fails, save the markdown locally. User can copy-paste into the Medium editor.

## Step 7: Report

Output a summary:

```
Article Published to Medium!
  Title: [title]
  URL: [url]
  Status: draft / public / unlisted
  Tags: [tag1, tag2, tag3]
  ID: [article_id]
  Word count: ~[count]
  Note: Edit via Medium web editor (API is publish-only)
```

If YouMind is configured, offer to archive the article to the user's knowledge base.

## Routing Shortcuts

| User input | Pipeline |
|-----------|----------|
| Topic only ("write about X") | Steps 1-7 |
| Topic + specific requirements | Steps 1, 4-7 (skip broad research) |
| Raw markdown file | Steps 1, 4, 6-7 (adapt and publish) |
| "validate my setup" | Steps 1 only (validate, no publish) |
