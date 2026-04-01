# Hashnode Article Pipeline

7-step execution pipeline from topic to published article.

## Step 1: Config Load

1. Read `config.yaml` for API keys
2. Validate Hashnode token and publication ID (call `validate` command)
3. Check YouMind API key availability (optional)
4. Report config status

**Fallback:** If config.yaml missing, check environment variables (`HASHNODE_TOKEN`, `HASHNODE_PUBLICATION_ID`, `YOUMIND_API_KEY`).

## Step 2: YouMind Knowledge Mining

1. If YouMind API key is configured, search user's knowledge base for relevant materials
2. Use `youmind-api.ts mine-topics` with the user's topic keywords
3. Collect relevant articles, notes, and documents as source material
4. Build a knowledge context summary

**Fallback:** If YouMind not configured or fails, skip with empty knowledge context.

## Step 3: Research

1. Use YouMind web search to find current information about the topic
2. Search for related Hashnode articles to understand existing coverage
3. Use `search-tags` to find relevant Hashnode tags
4. Identify unique angles and SEO opportunities
5. Collect code examples, data points, and authoritative sources

**Fallback:** If web search fails, ask user to provide key points or references.

## Step 4: Content Adaptation

Read `content-adaptation.md` before this step.

1. Choose article structure (tutorial, deep dive, quick tip, comparison)
2. Craft SEO-optimized title (50-70 chars, keyword-front-loaded)
3. Write a compelling subtitle (hook/teaser)
4. Select up to 5 tags from Hashnode's tag ecosystem
5. Write meta description (max 160 chars) for SEO
6. Plan code examples with language tags
7. Plan heading hierarchy for table of contents generation

## Step 5: Write

1. Write opening paragraph (hook + promise)
2. Write the article following the planned structure
3. Ensure all code blocks have language tags
4. Target 800-3000 words depending on article type
5. Run content through `adaptForHashnode()` for validation
6. Review and address any warnings

**Quality checks:**
- Title is SEO-optimized (50-70 chars)
- Subtitle is present and compelling
- Tags are valid (max 5, exist on Hashnode)
- Meta description is under 160 chars
- Code blocks all have language tags
- Heading hierarchy is clean (H2 > H3)
- No marketing fluff
- Canonical URL set for cross-posts

## Step 6: Publish

1. Run `cli.ts publish` with the markdown file
2. Hashnode publishes immediately to the specified publication
3. Include subtitle, tags, cover image, canonical URL, series, and meta tags
4. Report post ID, URL, and reading time

**Fallback:** If Hashnode API fails, save the markdown locally. User can paste into Hashnode editor.

## Step 7: Report

Output a summary:

```
Article Published!
  Title: [title]
  Subtitle: [subtitle]
  URL: [url]
  Tags: [tag1, tag2, tag3]
  ID: [post_id]
  Read time: [X] min
  Word count: ~[count]
  Warnings: [any content warnings]
```

If YouMind is configured, offer to archive the article to the user's knowledge base.

## Routing Shortcuts

| User input | Pipeline |
|-----------|----------|
| Topic only ("write about X") | Steps 1-7 |
| Topic + specific requirements | Steps 1, 4-7 (skip broad research) |
| Raw markdown file | Steps 1, 4, 6-7 (adapt and publish) |
| "validate my article" | Steps 1, 4 only (validate, no publish) |
| "add to series X" | Steps 1, 4-7 with series ID |
