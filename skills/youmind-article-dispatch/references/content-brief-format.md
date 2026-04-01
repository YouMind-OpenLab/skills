# Content Brief Format

The content brief is the standardized data structure passed from the dispatch skill to each platform sub-skill. It ensures consistent context while allowing each platform to independently adapt content.

## Brief Structure

```yaml
# Content Brief — passed to each platform skill as context
topic: "The core topic in one sentence"
angle: "The specific angle, atomic insight, or unique perspective"
keywords:
  - "primary keyword"
  - "secondary keyword"
  - "tertiary keyword"
tone: "professional"  # professional | casual | technical | conversational | editorial
language: "en"        # ISO 639-1 language code (en, zh, ja, ko, etc.)

# YouMind knowledge context (pre-fetched by dispatch, optional)
source_material:
  - title: "Related article from knowledge base"
    snippet: "First 300 characters of content..."
    id: "youmind-entity-id"
    source: "search"  # search | material | craft
    relevance: 0.85

# User constraints (optional, platform skill applies its own defaults)
constraints:
  max_length: null      # null = let platform decide
  style: null           # null = let platform decide
  publish_mode: "draft" # draft | publish
  custom_tags: []       # user-specified tags (platform skill may adapt)
  cover_image_url: null # pre-generated cover image URL
```

## Field Details

### topic (required)
One sentence describing what the content is about. This is the seed — each platform skill expands it according to its audience.

### angle (optional)
The specific perspective or "atomic insight" that makes this content unique. If not provided, the platform skill should develop its own angle based on its audience's interests.

### keywords (optional)
SEO/discovery keywords. Each platform skill maps these to its own tag/hashtag system:
- Dev.to: tags (max 4)
- Hashnode: tags (max 5)
- LinkedIn: hashtags (3-5)
- X: hashtags (1-2)
- Reddit: flair selection hint

### tone (optional)
Suggested tone. Platform skills may override based on platform norms:
- LinkedIn always leans professional
- X always leans conversational
- Reddit always leans authentic/casual

### source_material (optional)
Pre-fetched from YouMind knowledge base by dispatch. This avoids each platform skill making redundant YouMind API calls. Platform skills should use this as background research, not copy verbatim.

### constraints (optional)
User-specified overrides. Fields left as `null` let the platform skill use its defaults.

## Usage

When dispatch invokes a platform skill, include the brief in the initial context:

```
"Here is the content brief for this dispatch:
Topic: {topic}
Angle: {angle}
Keywords: {keywords}
Tone: {tone}
Language: {language}

Background material from YouMind:
{source_material formatted as bullet list}

Please follow your platform skill pipeline to create content adapted for your platform's audience."
```
