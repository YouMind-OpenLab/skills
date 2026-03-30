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

These are the proven optimal values for WeChat mobile reading. The toolkit's theme engine uses these as defaults.

| Parameter | Optimal Value | Range |
|-----------|--------------|-------|
| Body text size | 15-16px | 14-16px acceptable |
| Annotation/small text | 13px | — |
| H2 subheading size | 17-18px | 3pt larger than body |
| H1 title size | 18-24px | — |
| Line height | 1.75x font size | 1.5x-1.75x (mobile prefers 1.75x) |
| Letter spacing | 1-1.5px | Never exceed 2px |
| Paragraph spacing | 1.2x the line height | — |
| Page margins | 15-20px (1.0-1.3em) | — |
| Characters per line | 35-45 | — |
| Text alignment | Justified (两端对齐) | — |

### Color System — The Three-Color Maximum Rule

Excluding images, total article colors should be 3 or fewer:

| Role | Recommendation | Proportion |
|------|---------------|------------|
| Theme/accent color | Brand color for titles, emphasis, headers/footers | ~75% |
| Body text color | **NEVER pure black #000000.** Use #595959 or #3f3f3f | — |
| Annotation/quote color | #888888 or #a5a5a5 | ~20% |
| Highlight color | Coordinated with theme, LOW saturation | ~5% |

**Rules:**
- Avoid high-saturation colors (causes visual fatigue on extended reading)
- Text colors should harmonize with image colors
- Skip underlines and italics — designed for Latin typography, poor in Chinese
- Bold + accent color is the preferred emphasis method

### Whitespace
- 2 blank lines above subheadings, 1 blank line below
- One image per 3 screens of text
- Never exceed 7-10 consecutive text lines without a visual break
- Proper whitespace improves reader comfort by ~15% (A/B testing data)
