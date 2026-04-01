# WordPress Content Adaptation Guide

## Writing Rules for WordPress

### Structure
- **Title (H1):** 50-70 characters for SEO. The H1 heading is extracted as the WordPress post title.
- **Excerpt:** 150-300 characters. Used for search results, RSS feeds, and archive pages.
- **Body:** Use H2-H4 for subheadings. Keep paragraphs short (3-5 sentences).
- **Word count:** 1,000-3,000 words depending on topic depth.

### SEO Considerations
- Include the primary keyword in the title, first paragraph, and at least one subheading.
- Use internal links to other posts on the same site when relevant.
- Add alt text to all images.
- Keep URL slugs short and keyword-rich.

### Formatting Best Practices
- Use Markdown for writing; the adapter handles HTML conversion.
- Code blocks with language identifiers for syntax highlighting.
- Use blockquotes for callouts and important notes.
- Lists (ordered and unordered) for scannable content.
- Tables for data comparison.

### WordPress-Specific Notes
- The H1 heading is stripped from the body HTML (WordPress uses the title field separately).
- Tags and categories are resolved against existing WordPress taxonomy.
- New tags are created automatically; categories must exist beforehand.
- Featured images are uploaded separately via the Media API.

### Image Handling
- Featured image: Upload via `upload-media` command or `--featured-image` flag.
- Inline images: Use standard Markdown image syntax; URLs must be absolute.
- Recommended featured image size: 1200x628px (social sharing optimized).

### Post Status Options
- `draft` (default): Saved but not visible to readers. Review before publishing.
- `publish`: Immediately visible on the site.
- `pending`: Submitted for editorial review.
- `private`: Only visible to logged-in users with appropriate permissions.
