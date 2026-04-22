# X Publishing Pipeline

All publishing flows through YouMind's OpenAPI. The caller holds only a YouMind API key; X OAuth tokens live inside YouMind.

## Step-by-Step Execution

### Step 1 -- Load Configuration
- Read `~/.youmind/config.yaml` for `youmind.api_key` (and optional `youmind.base_url`)
- Validate the API key is present
- The X account itself is not configured locally — it is connected once inside YouMind

### Step 2 -- Research Topic (Optional)
- Mine the YouMind knowledge base for relevant material (`mineTopics`)
- Use web search for trending angles (`webSearch`)
- Identify current conversations to join

### Step 3 -- Write Content
- Determine format: single tweet or multi-tweet sequence
- Single tweet: craft a punchy 280-char message with a strong hook
- Thread: write structured long-form content, then split

### Step 4 -- Adapt Content
- **Single tweet**: Run through `adaptSingleTweet()`
  - Strip Markdown, enforce 280 chars, add 1-2 hashtags
- **Thread**: Run through `splitIntoThread()`
  - Split at paragraph boundaries
  - Add numbering (`1/N`) into the text
  - Ensure each tweet makes sense standalone
  - Hook in first tweet, CTA in last

### Step 5 -- Prepare Images (Optional)
- If images are provided, they must already be hosted under `https://cdn.gooo.ai/...`
- Local files cannot be uploaded by the skill — upload them to YouMind first, then pass the resulting CDN URL
- At most 4 image URLs per tweet

### Step 6 -- Publish via YouMind OpenAPI
- **Single tweet**: `POST /openapi/v1/createXPost` with `{ text, mediaUrls? }`
- **Thread**: call `/createXPost` once per tweet in order, passing each previous tweet's `postId` as `replyToPostId` to the next call. X renders the chain as a native thread.
  - Images, if provided, attach to the first tweet only
- Both return `{ postId, text, url }`

### Step 7 -- Archive to YouMind (Optional)
- Save the published content back to the YouMind knowledge base via `saveArticle`
- Record post IDs for future reference

### Step 8 -- Report Results
- Display post IDs and URLs
- Include result links (lead tweet URL first, best platform entry URL as fallback)
- Show character counts
- List any warnings (adaptation truncation, rejected non-CDN media URLs, thread-chain degradation)
- Provide engagement tips

## Fallbacks

| Step | Fallback |
|------|----------|
| 2 Research | Skip, write from topic alone |
| 5 Images | Warn, publish without media (non-CDN URLs are dropped with a warning) |
| 6 Publish | Save adapted text locally under `output/` for manual posting |
| 7 Archive | Warn, continue |

## Decision: Tweet vs Thread

- Content < 280 chars → single tweet
- Content 280-2000 chars → thread (3-8 tweets)
- Content 2000+ chars → long thread (8+)
- User explicitly says "thread" → always thread
- User explicitly says "tweet" → single tweet (truncate if needed)

Threads publish as a native X reply chain. Prefer a concise single tweet when the topic fits — save threads for when the user explicitly asks for one or the content genuinely needs multi-tweet pacing.
