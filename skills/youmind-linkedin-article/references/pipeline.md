# LinkedIn Publishing Pipeline

## Step-by-Step Execution

### Step 1: Load Configuration
- Read `~/.youmind/config.yaml` for the YouMind API key and `~/.youmind/config/youmind-linkedin-article.yaml` for LinkedIn-specific credentials
- Validate `linkedin.access_token` and `linkedin.person_urn` are present
- If missing, prompt user to complete setup

### Step 2: Research Topic (Optional)
- If user provided a topic, mine YouMind knowledge base for relevant material
- Use `youmind-api.ts` search and mineTopics for source content
- Use web search for trending angles on the topic

### Step 3: Write Post Content
- Apply LinkedIn best practices:
  - Strong hook in first 2 lines
  - Short paragraphs (1-3 sentences)
  - Professional but approachable tone
  - Specific data points and examples
  - One clear takeaway

### Step 4: Adapt Content
- Run through `content-adapter.ts`:
  - Convert any Markdown to Unicode formatting
  - Extract external links (move to first comment)
  - Enforce 3,000 character limit
  - Add hashtags (auto-generated or user-specified)
  - Append CTA question

### Step 5: Upload Images (Optional)
- If user provided images:
  - Register upload with LinkedIn API
  - Upload binary data
  - Collect asset URNs

### Step 6: Publish Post
- Call LinkedIn Posts API with:
  - Adapted text as commentary
  - Image assets (if any)
  - Visibility setting (PUBLIC default)
  - Author URN (person or organization)

### Step 7: Archive to YouMind (Optional)
- If YouMind API key is configured:
  - Save the published content to YouMind as a document
  - Provides a record of published content

### Step 8: Report Results
- Display:
  - Post ID
  - Character count
  - Extracted links (for first comment)
  - Any warnings from adaptation
  - Engagement tips

## Fallbacks

| Step | Fallback |
|------|----------|
| 2 Research | Skip, write from topic alone |
| 5 Image upload | Warn, publish without images |
| 6 Publish | Save adapted text locally for manual posting |
| 7 Archive | Warn, continue |
