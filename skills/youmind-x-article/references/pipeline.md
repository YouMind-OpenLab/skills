# X Publishing Pipeline

## Step-by-Step Execution

### Step 1: Load Configuration
- Read `config.yaml` for X credentials and YouMind API key
- Determine auth method: OAuth 2.0 or OAuth 1.0a
- Validate credentials are present

### Step 2: Research Topic (Optional)
- Mine YouMind knowledge base for relevant material
- Use web search for trending topics and angles
- Identify current conversations to join

### Step 3: Write Content
- Determine format: single tweet, thread, or long-form article
- For single tweet: craft a punchy 280-char message
- For thread: write structured long-form content
- For long-form: write full article (X Premium)

### Step 4: Adapt Content
- **Single tweet**: Run through `adaptSingleTweet()`
  - Strip Markdown, enforce 280 chars, add 1-2 hashtags
- **Thread**: Run through `splitIntoThread()`
  - Split at paragraph boundaries
  - Add numbering (1/N)
  - Ensure each tweet makes sense standalone
  - Hook in first tweet, CTA in last
- **Long-form**: Run through `adaptLongForm()`
  - Keep Markdown, enforce 25K chars

### Step 5: Upload Media (Optional)
- If images provided, upload via v1.1 media/upload.json
- Collect media_id_string values
- Attach to first tweet (or specific tweet in thread)

### Step 6: Publish
- **Single tweet**: POST /tweets
- **Thread**: Sequential POST /tweets with reply_to chain
  - 1-second delay between tweets to avoid rate limits
  - Each tweet replies to the previous one
- **Long-form**: Use X Premium article creation flow

### Step 7: Archive to YouMind (Optional)
- Save published content to YouMind knowledge base
- Record tweet IDs for future reference

### Step 8: Report Results
- Display tweet IDs and URLs
- Show character counts
- List any warnings from adaptation
- Provide engagement tips

## Fallbacks

| Step | Fallback |
|------|----------|
| 2 Research | Skip, write from topic alone |
| 5 Media upload | Warn, publish without media |
| 6 Publish | Save adapted text locally for manual posting |
| 7 Archive | Warn, continue |

## Decision: Tweet vs Thread

- Content < 280 chars -> single tweet
- Content 280-2000 chars -> thread (3-8 tweets)
- Content 2000+ chars -> long thread (8+) or long-form article
- User explicitly says "thread" -> always thread
- User explicitly says "tweet" -> single tweet (truncate if needed)
