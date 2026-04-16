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

# Resolved author profile (computed by dispatch, per-platform)
# This is NOT the raw author-profile.yaml — dispatch merges author DNA with
# platform DNA and sends only the resolved, relevant fields for THIS platform.
# See references/content-adaptation-matrix.md for merge rules.
resolved_author:
  voice:
    register: "conversational-technical"  # already adjusted for this platform
    perspective: "first-person-practitioner"
    signature_patterns:
      - "Show working code before explaining theory"
    anti_patterns:
      - "Never use marketing language"
      # Platform-specific anti-patterns are MERGED in by dispatch
    humor_level: "light"
  audience:
    primary: "Mid-level developers building production systems"
    content_depth: "practitioner"
  content:
    preferred_types: ["tutorial", "deep-dive"]
    code_density: "high"
    code_format: "blocks"  # resolved per platform: blocks | screenshots | minimal
  depth_adaptation: null   # non-null if dispatch detected depth mismatch → mandatory adaptation

# User constraints (optional, platform skill applies its own defaults)
constraints:
  max_length: null      # null = let platform decide
  style: null           # null = let platform decide
  publish_mode: "draft" # draft | publish
  custom_tags: []       # user-specified tags (platform skill may adapt)
  cover_image_url: null # pre-generated cover image URL
  override_depth_check: false  # true = skip mandatory depth adaptation
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

### tone (optional, may be overridden by resolved_author.voice.register)
Suggested tone. If `resolved_author` is present, the resolved register takes precedence. Otherwise platform skills apply their own defaults:
- LinkedIn always leans professional
- X always leans conversational
- Qiita always leans formal-technical (丁寧語)

### resolved_author (optional, computed by dispatch)
The **per-platform resolved author profile** — computed by dispatch from the user's `author-profile.yaml` merged with the target platform's DNA via `references/content-adaptation-matrix.md`. This is NOT the raw author profile. It contains only fields relevant to THIS specific platform, with all conflicts already resolved. See `references/author-profile-spec.md` for the source format and `references/content-adaptation-matrix.md` for merge rules. If this block is absent, the author has no profile — platform skills use their own defaults.

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
Language: {language}

Author voice (resolved for this platform):
  Register: {resolved_author.voice.register}
  Perspective: {resolved_author.voice.perspective}
  Signature patterns: {resolved_author.voice.signature_patterns}
  Anti-patterns: {resolved_author.voice.anti_patterns}
  Target audience: {resolved_author.audience.primary}
  Content depth: {resolved_author.audience.content_depth}
  Code density: {resolved_author.content.code_density} (format: {resolved_author.content.code_format})

{if depth_adaptation is non-null:}
⚠️ Depth adaptation required: author targets '{from}' depth but this platform expects '{to}'.
   Adapt outline and examples accordingly.

Background material from YouMind:
{source_material formatted as bullet list}

Please follow your platform skill pipeline. Use the resolved author voice as your baseline,
then apply your platform-dna.md constraints on top."
```

### Brief without author profile

If no `author-profile.yaml` exists, the `resolved_author` block is omitted entirely. The brief is identical to v1 and platform skills work with their own defaults. No degradation.
