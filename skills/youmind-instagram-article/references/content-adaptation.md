# Instagram Content Adaptation Guide

## Platform Characteristics

- **Visual-first platform** — IMAGES ARE REQUIRED for every post
- **Content format**: Image(s) + caption (no standalone text posts)
- **Algorithm**: Rewards saves, shares, and time-on-post
- **Carousel**: Most effective format for educational/informational content

## Critical Constraint

**Instagram does NOT support text-only posts.** Every publish operation must include at least one publicly accessible image URL. If you don't have images, you must generate them first using an external image generation tool.

## Caption Structure

### Hook Line (First 125 Characters)
Only the first ~125 characters are visible before "more". This line MUST:
- Stop the scroll
- Create curiosity or deliver immediate value
- Make people tap "more"

Techniques:
- Bold claim: "This one habit changed everything."
- Question: "Why do 90% of startups fail in year one?"
- Shock value: "I deleted all my apps for 30 days. Here's what happened."
- Direct address: "If you're struggling with productivity, read this."

### Body Content
- Deliver value promised by the hook
- Use emoji bullets for key points
- Keep paragraphs to 1-2 sentences
- Use line breaks liberally

### Call to Action
- "Save this for later" (saves boost algorithm ranking)
- "Share with someone who needs this"
- "Follow @username for more"
- "Drop a comment with your favorite tip"
- "Double tap if you agree"

### Hashtag Section
- Separate hashtags from caption with dots or line breaks
- 20-30 relevant hashtags
- Mix of: niche (low competition), medium, and broad (high volume)
- Can also place hashtags in first comment instead

## Caption Limits

| Type | Limit |
|------|-------|
| Caption length | 2,200 characters |
| Visible before fold | ~125 characters |
| Hashtags | 30 maximum |
| Mentions | 20 maximum |

## Carousel Best Practices

Carousels are the HIGHEST PERFORMING format for educational content:

- **Slides**: 2-10 images per carousel
- **Dimensions**: 1080x1080 (square) or 1080x1350 (portrait, recommended)
- **Slide 1**: Hook/title slide — must stop the scroll
- **Slides 2-9**: One key point per slide, clear and readable
- **Last slide**: CTA slide (follow, save, share)

### Carousel Content Strategy
1. **Title slide**: Bold topic statement + visual hook
2. **Problem slide**: Identify the pain point
3. **Solution slides**: 3-5 actionable key points
4. **Summary slide**: Recap the main takeaways
5. **CTA slide**: "Follow for more" / "Save this post"

### Text on Images
- Large, readable font (minimum 24pt equivalent)
- High contrast against background
- Maximum 30 words per slide
- Consistent design across all slides

## Image Requirements

### Dimensions
| Format | Size | Best for |
|--------|------|----------|
| Square | 1080x1080px | Standard posts |
| Portrait | 1080x1350px | Carousels (recommended) |
| Landscape | 1080x566px | Rarely used, less feed space |

### Technical Requirements
- File format: JPEG or PNG
- Max file size: 8MB per image
- Images must be hosted on a **publicly accessible URL**
- Instagram downloads the image during processing

## Hashtag Strategy

### Structure (aim for 20-30 total)
- **5-10 niche hashtags** (< 100K posts): specific to your exact topic
- **5-10 medium hashtags** (100K-500K posts): broader topic area
- **5-10 broad hashtags** (500K+ posts): general engagement

### Placement Options
1. **In caption**: Separated by dots/line breaks at the bottom
2. **In first comment**: Keeps caption cleaner, same algorithmic effect

## Tone and Voice

- **Inspirational**: "You can do this" energy
- **Educational**: Teach something valuable
- **Authentic**: Real experiences over polished perfection
- **Concise**: Every word earns its place
- **Emoji-friendly**: Use emojis as visual anchors, not decoration

## Integration with Image Generation

This skill generates:
- **Slide descriptions**: Text content for each carousel slide
- **Image prompts**: Ready-to-use prompts for AI image generation tools
- **Cover image prompt**: Specific prompt for the main/first image

To create the actual images, use:
- YouMind's `chatGenerateImage` API
- DALL-E / OpenAI Images API
- Midjourney
- Any image generation tool that outputs publicly accessible URLs
