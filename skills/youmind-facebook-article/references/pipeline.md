# Facebook Post Publishing Pipeline

## Overview

The pipeline transforms a topic or raw content into a published Facebook Page post.

```
Config -> YouMind Research -> Web Research -> Adapt -> Write -> Publish -> Report
```

## Step 1: Load Configuration

Read `config.yaml` and validate:
- `youmind.api_key` — for knowledge base and web search (optional but recommended)
- `facebook.page_id` — required for publishing
- `facebook.page_access_token` — required for publishing

If credentials are missing, warn the user and offer to proceed with preview-only mode.

## Step 2: YouMind Knowledge Mining

If YouMind API key is configured:
1. Call `mineTopics()` with the user's topic keywords
2. Call `search()` for semantically related content in the knowledge base
3. Collect relevant snippets as source material

Fallback: Skip this step, proceed with web search only.

## Step 3: Web Research

If YouMind API key is configured:
1. Call `webSearch()` for current information on the topic
2. Extract key facts, statistics, and angles

Fallback: Skip research, write from the topic alone.

## Step 4: Content Adaptation

Transform the gathered material into Facebook-optimized format:
1. Strip any markdown formatting (Facebook renders plain text only)
2. Create a scroll-stopping hook line
3. Structure content with short paragraphs and emoji bullets
4. Add engagement CTA (comment/share prompt)
5. Append relevant hashtags (1-3 maximum)
6. If a link is provided, place it for preview card generation

See `references/content-adaptation.md` for detailed formatting rules.

## Step 5: Write Post

Compose the final post:
- Hook first sentence that stops scrolling
- 2-4 short paragraphs of value
- Emoji-enhanced key points
- CTA for engagement
- Link (if applicable)
- Hashtags

Optimal length: 40-80 words for maximum engagement.

## Step 6: Publish

Determine post type and publish:
- **Text post**: message only -> POST /{page_id}/feed
- **Link post**: message + link -> POST /{page_id}/feed with link parameter
- **Photo post**: image + caption -> POST /{page_id}/photos

Validate the response and extract the post ID.

Fallback: If publishing fails, save the post text to a local file and report the error.

## Step 7: Report

Output the results:
- Post ID
- Permalink URL
- Post type (text/link/photo)
- Character count
- Publication status (published/scheduled/draft)

## Routing Shortcuts

| User provides | Skip to |
|---------------|---------|
| A specific topic | Step 2 (skip topic selection) |
| Raw text/markdown | Step 4 (skip research) |
| Complete post text with --raw | Step 6 (skip adaptation) |

## Error Handling

| Step | Error | Action |
|------|-------|--------|
| 1 | Missing config | Warn, offer preview mode |
| 2 | YouMind API fails | Skip, use web search |
| 3 | Web search fails | Skip, write from topic |
| 6 | Publish fails | Save locally, report error |
| 6 | Token expired | Report with refresh instructions |
