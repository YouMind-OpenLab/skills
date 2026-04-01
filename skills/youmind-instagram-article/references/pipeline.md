# Instagram Post Publishing Pipeline

## Overview

The pipeline transforms a topic or article content into a published Instagram post or carousel.

```
Config -> YouMind Research -> Adapt Content -> Prepare Images -> Create Container -> Poll Status -> Publish -> Report
```

**CRITICAL**: Instagram requires images for every post. The pipeline cannot complete
without at least one publicly accessible image URL.

## Step 1: Load Configuration

Read `config.yaml` and validate:
- `youmind.api_key` — for knowledge base and web search (optional but recommended)
- `instagram.business_account_id` — required for publishing
- `instagram.access_token` — required for publishing

If credentials are missing, warn the user and offer to proceed with preview-only mode.

## Step 2: YouMind Knowledge Mining

If YouMind API key is configured:
1. Call `mineTopics()` with the user's topic keywords
2. Call `search()` for semantically related content
3. Collect relevant snippets as source material

Fallback: Skip, write from the topic alone.

## Step 3: Content Adaptation

Transform gathered material into Instagram-optimized format:
1. Extract key points from the content (for carousel slides)
2. Write a hook line (visible in first 125 chars)
3. Build the full caption with body, CTA, and hashtags
4. Generate slide descriptions for carousel format
5. Create image generation prompts

See `references/content-adaptation.md` for detailed formatting rules.

### Caption Structure
```
[Hook line - stops the scroll]

[Key points with emoji bullets]

[Call to action]

.
.
.
#hashtag1 #hashtag2 ... #hashtag30
```

## Step 4: Image Preparation

**This step requires user input or an external image generation tool.**

Options:
1. User provides image URLs directly
2. Use YouMind's `chatGenerateImage` to create images from prompts
3. Use another image generation API (DALL-E, Midjourney, etc.)

Requirements:
- All image URLs must be **publicly accessible** (Instagram downloads them)
- Supported formats: JPEG, PNG
- Max 8MB per image
- Square (1080x1080) or portrait (1080x1350) recommended

For carousels: 2-10 images with the same aspect ratio.

## Step 5: Create Media Container

### Single Image Post
1. POST `/{ig_user_id}/media` with `image_url` and `caption`
2. Receive container ID

### Carousel Post
1. For each image: POST `/{ig_user_id}/media` with `image_url` + `is_carousel_item=true`
2. Collect all child container IDs
3. Wait for each child to process (poll status)
4. POST `/{ig_user_id}/media` with `media_type=CAROUSEL`, `children=[ids]`, `caption`
5. Receive carousel container ID

## Step 6: Poll Container Status

Poll `GET /{container_id}?fields=status_code` until:
- `FINISHED` — proceed to publish
- `ERROR` — report error, suggest checking image URL
- `EXPIRED` — report, need to create new container

Timeout: 60 seconds with 3-second poll interval.

## Step 7: Publish

POST `/{ig_user_id}/media_publish` with `creation_id={container_id}`

Receive the published media ID.

## Step 8: Report

Output the results:
- Media ID
- Permalink URL
- Media type (IMAGE or CAROUSEL_ALBUM)
- Caption length
- Number of images (for carousels)
- Hashtag count

## Routing Shortcuts

| User provides | Skip to |
|---------------|---------|
| Topic + image URLs | Step 3 (adapt content, then publish) |
| Caption + image URLs | Step 5 (create container directly) |
| Content for preview only | Step 3, stop after adaptation |

## Error Handling

| Step | Error | Action |
|------|-------|--------|
| 1 | Missing config | Warn, offer preview mode |
| 2 | YouMind fails | Skip research |
| 4 | No images | STOP — cannot proceed, inform user |
| 5 | Container creation fails | Report API error details |
| 6 | Processing timeout | Report container ID for manual retry |
| 6 | Processing error | Suggest checking image URL accessibility |
| 7 | Publish fails | Report container ID, may retry |
