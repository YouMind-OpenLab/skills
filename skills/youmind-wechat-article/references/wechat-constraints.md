# WeChat Platform Technical Constraints

> Hard technical limits enforced by the WeChat article editor and rendering engine.
> The toolkit's converter handles most of these automatically, but you need to
> understand them to avoid producing content that breaks on render.

---

## Unsupported Features

### CSS (Blocked by WeChat)
- External stylesheets (`<link>`, `<style>` blocks)
- `position: fixed` / `sticky`
- CSS `transform` / `animation` / `transition`
- CSS `filter` / `backdrop-filter`
- `@font-face` custom fonts
- CSS Grid (partial/unreliable support)
- Flexbox (partial/unreliable support)
- CSS Variables (`var(--xxx)`)
- Media queries

### HTML (Stripped by WeChat)
- `<script>` tags
- Event attributes (`onclick`, `onload`, etc.)
- `<video>`, `<audio>` tags
- `<iframe>`
- `<form>` elements
- SVG (limited, unreliable support)

### Images
- Local file paths (must be uploaded URLs or WeChat media URLs)
- Single image > 5MB
- WebP format (inconsistent device support)

---

## What Works: The Converter's Approach

The toolkit's HTML converter already implements these solutions:

1. **All styles must be inline** (`style=""` attribute on each element)
2. Only WeChat-safe CSS properties are used
3. Code blocks: `<pre><code>` with `white-space: pre-wrap`
4. Images: uploaded to WeChat to get media URLs before publishing
5. Tables: kept ≤ 4 columns for mobile screen fit
6. **Every `<p>` must have explicit `color` attribute** (WeChat does NOT inherit color from parent)
7. Only system font stacks (no custom fonts)

---

## Content Size Limits

| Element | Limit |
|---------|-------|
| Draft title | ≤ 64 bytes |
| Digest (摘要) | ≤ 120 UTF-8 bytes (~54 Chinese characters) |
| Article HTML body | ≤ 2 MB |
| Single image | ≤ 5 MB |
| Images per article | ≤ 20 |
| Cover image | 900×383 recommended (2.35:1 ratio) |

---

## Formatting Parameters (Research-Backed Optimal Values)

These are the proven optimal values for WeChat mobile reading. The toolkit's theme engine uses these as defaults. Extended ranges are available for themes with specific design intent (see `theme-dsl.md` for full guidance).

| Parameter | Optimal Value | Comfortable Range | Extended Range |
|-----------|--------------|-------------------|----------------|
| Body text size | 15-16px | 14-17px | 14-18px |
| Annotation/small text | 13px | 12-14px | — |
| H2 subheading size | 17-18px | 17-24px | 17-28px |
| H1 title size | 22-24px | 20-28px | 20-36px |
| Line height | 1.75x font size | 1.6x-2.0x | 1.5x-2.2x |
| Letter spacing | 0.5-1.5px | 0-2px | -0.05em to 4px |
| Paragraph spacing | 1.2x line height | 12-28px | 8-36px |
| Page margins | 15-20px | 8-20px | — |
| Characters per line | 35-45 | — | — |
| Text alignment | Left or Justified | — | — |

### Color System

Assign colors by **role**, not by counting. The fundamental roles are:

| Role | Recommendation | Purpose |
|------|---------------|---------|
| Primary color | Brand/theme color for titles, emphasis, decorations | Core identity |
| Body text color | **NEVER pure black #000000.** Use #2c2c2c – #444444 | Comfortable reading |
| Auxiliary color | #666666 – #999999 for quotes, captions, secondary text | Visual hierarchy |
| Accent (optional) | Primary color at 5-15% opacity for backgrounds, highlights | Surface and emphasis |
| Surface (optional) | Near-white tints or dark surfaces for code blocks, cards | Context-switch signal |

Three roles (primary + body + auxiliary) is the safest floor. Four or five roles (accent + surface) are perfectly fine when they derive coherently from the same primary color family.

**Rules:**
- Avoid high-saturation colors for body text (causes visual fatigue)
- Text colors should harmonize with image tones
- Bold + accent color is the preferred emphasis method for Chinese text
- Underlines work well for links; use sparingly elsewhere

### Whitespace
- 2 blank lines above subheadings, 1 blank line below
- One image per 3 screens of text
- Never exceed 7-10 consecutive text lines without a visual break
- Proper whitespace improves reader comfort by ~15% (A/B testing data)
