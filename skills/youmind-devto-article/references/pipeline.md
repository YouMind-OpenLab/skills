# Dev.to Article Pipeline

7-step execution pipeline from topic to published article.

## Step 1: Config Load

1. Read `config.yaml` for the YouMind API key
2. Validate the YouMind API key (call `validate` command or attempt list)
3. Check that the user's Dev.to account is already connected in YouMind
4. Report config status

**Configuration rule:** Read `youmind.api_key` and `youmind.base_url` from local `config.yaml`. Keep documentation and examples on `https://youmind.com/openapi/v1`; local backend debugging should only change the local config file.

## Step 2: YouMind Knowledge Mining

1. If the YouMind API key is configured, search the user's knowledge base for relevant materials
2. Use `youmind-api.ts mine-topics` with the user's topic keywords
3. Collect relevant articles, notes, and documents as source material
4. Build a knowledge context summary

**Fallback:** If YouMind not configured or fails, skip with empty knowledge context. The article can still be written.

## Step 3: Research

1. Use YouMind web search to find current information about the topic
2. Search for related Dev.to articles to understand existing coverage
3. Identify unique angles not covered by top results
4. Collect code examples, benchmarks, and data points

**Fallback:** If web search fails, ask user to provide key points or references.

## Step 4: Content Adaptation

Read `content-adaptation.md` before this step.

1. Choose article structure (tutorial, deep dive, quick tip, comparison)
2. Front-load the main keyword in the title (60-80 chars)
3. Select up to 4 tags from Dev.to's popular tags
4. Write a description (max 170 chars) for SEO
5. Plan code examples with language tags
6. Decide if a TL;DR needs to be generated

## Step 5: Write

1. Write TL;DR (2-3 sentences)
2. Write the article following Problem-Solution-Code-Result structure
3. Ensure all code blocks have language tags
4. Target 800-2500 words depending on article type
5. Run content through `adaptForDevto()` for validation
6. Review and address any warnings

**Quality checks:**
- No marketing language
- Every claim backed by code or evidence
- Code blocks are runnable (or clearly pseudocode)
- Title is keyword-front-loaded
- Description is under 170 chars
- Tags are valid (max 4, lowercase, alphanumeric + hyphens)

## Step 6: Publish

1. Run `cli.ts publish` with the markdown file
2. Default to draft mode (`published: false`) unless user explicitly requests public
3. Include tags, description, cover image URL, canonical URL, and series if provided
4. Report article ID, URL, and status

**Fallback:** If Dev.to publishing through YouMind fails, save the adapted markdown locally with front matter. User can paste it into the Dev.to editor.

## Step 7: Report

Output a summary:

```
Article Published!
  Title: [title]
  URL: [url]
  Status: draft / published
  Tags: [tag1, tag2, tag3]
  ID: [article_id]
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
