# Reddit Publishing Pipeline

## Step-by-Step Execution

### Step 1: Load Configuration
- Read `config.yaml` for Reddit credentials and YouMind API key
- Validate client_id, client_secret, username, password, user_agent
- Authenticate and obtain OAuth token

### Step 2: Research Topic (Optional)
- Mine YouMind knowledge base for relevant material
- Use web search for current discussions on the topic
- Find relevant subreddit conversations

### Step 3: Analyze Target Subreddit
- Fetch subreddit rules via API
- Fetch available flairs
- Get tone guidance (formal/casual/technical)
- Check posting restrictions (self-post only, link only, etc.)

### Step 4: Write Post Content
- Match subreddit tone and conventions
- Include relevant technical details or examples
- Write descriptive, non-clickbait title
- Prepare body with proper structure

### Step 5: Adapt Content
- Run through `content-adapter.ts`:
  - Ensure Reddit-flavored Markdown compatibility
  - Generate or add TL;DR
  - Analyze title for clickbait patterns
  - Suggest appropriate flair
  - Add discussion question at end
  - Enforce 40,000 character limit

### Step 6: Submit Post
- Submit via Reddit API:
  - Self-post (kind=self) for text content
  - Link post (kind=link) for URL sharing
  - Attach flair if available and suggested
- Handle rate limits and errors

### Step 7: Archive to YouMind (Optional)
- Save published content to YouMind knowledge base
- Record post ID and URL for future reference

### Step 8: Report Results
- Display:
  - Post ID and URL
  - Subreddit and flair used
  - Character count
  - Any warnings about title or content
  - Engagement tips for the specific subreddit

## Fallbacks

| Step | Fallback |
|------|----------|
| 2 Research | Skip, write from topic alone |
| 3 Subreddit analysis | Use default tone, warn about missing rules |
| 5 Flair selection | Submit without flair, warn user |
| 6 Submit | Save adapted text locally for manual posting |
| 7 Archive | Warn, continue |

## Decision: Self Post vs Link Post

- User provided content/text -> self post
- User provided a URL to share -> link post
- User wants to discuss an article -> link post with comment
- User wants original content -> self post
