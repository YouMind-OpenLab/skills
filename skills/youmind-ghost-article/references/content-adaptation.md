# Ghost Content Adaptation Guide

## Writing Rules for Ghost

### Editorial Tone
Ghost is built for professional publishers and newsletter creators. Content should feel editorial — like a well-crafted magazine article or curated newsletter, not a generic blog post.

### Structure
- **Title:** Concise and compelling. Ghost displays titles prominently in cards and newsletters.
- **Custom Excerpt:** 150-300 characters. Ghost uses this for email previews, social sharing, and post cards. This is critical for newsletter open rates.
- **Body:** Use H2-H4 for subheadings. Keep paragraphs short and scannable.
- **Word count:** 800-2,500 words. Ghost's audience tends to prefer focused, well-edited pieces over long-form sprawl.

### Newsletter-Friendly Writing
Ghost posts often double as newsletter emails. Optimize for both:
- **Opening hook:** The first 2-3 sentences appear in email previews. Make them count.
- **Scannable structure:** Readers skim in their inbox. Use clear headings and short paragraphs.
- **Clean HTML:** Avoid complex layouts that break in email clients. Stick to standard elements.
- **Call to action:** If relevant, include a clear CTA near the end.

### Tag System
Ghost uses a flat tag system with primary/secondary distinction:
- **Primary tag** (first in list): Used for URL routing (`/tag-slug/post-slug/`) and template selection.
- **Secondary tags:** Used for filtering, internal organization, and content grouping.
- Tags are created automatically if they don't exist (Ghost handles this server-side).
- Use `#internal-tag` naming convention for tags meant for internal use only (not displayed publicly).

### Feature Images
- Ghost supports a dedicated feature image per post.
- Displayed at the top of the article and in post cards/previews.
- Recommended size: 1200x630px for optimal social sharing and card display.
- Can be uploaded as a file or specified as a URL.

### Post Status Options
- `draft` (default): Saved but not visible. Review and edit in Ghost editor before publishing.
- `published`: Immediately visible on the site and sent to newsletter subscribers (if email is enabled for the post).
- `scheduled`: Set a future publication date with `published_at`.

### Ghost-Specific HTML Notes
- Ghost accepts raw HTML via `?source=html` query parameter.
- The H1 heading should be omitted from HTML body — Ghost uses the `title` field.
- Ghost processes HTML through its Mobiledoc layer; keep HTML clean and standard.
- Inline styles are generally preserved but may be simplified.
- Ghost's Koenig editor supports cards (image, gallery, bookmark, etc.) but the Admin API works with raw HTML.

### Visibility Options
- `public`: Visible to everyone.
- `members`: Only visible to signed-up members (free or paid).
- `paid`: Only visible to paying members.
- `tiers`: Only visible to members of specific tiers.
