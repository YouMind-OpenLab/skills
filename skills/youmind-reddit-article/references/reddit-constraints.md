# Reddit Platform Constraints

## Post Limits

| Element | Limit |
|---------|-------|
| Title | 300 characters |
| Self-post body | 40,000 characters |
| Link URL | 2,048 characters |
| Flair text | 64 characters |
| Comment | 10,000 characters |

## Markdown Support

Reddit uses a custom Markdown flavor:
- **Supported:** headers, bold, italic, strikethrough, links, images (as links), code blocks, blockquotes, tables, lists, horizontal rules, superscript (`^text`)
- **NOT supported:** inline HTML (stripped), `<style>` tags, custom fonts, embedded media in self-posts
- **Quirks:** Single newline = same paragraph. Need double newline for paragraph break (or two trailing spaces for line break).

## API Rate Limits

| Endpoint | Rate |
|----------|------|
| Script OAuth | 60 requests/minute |
| Post submission | ~1 post per 10 minutes (new accounts stricter) |
| Comment submission | ~1 per minute |

## Posting Rules

- New accounts face posting restrictions (varies by subreddit)
- Many subreddits require minimum karma to post
- Some subreddits require flair on all posts
- Self-promotion ratio: Reddit's soft rule is ≤10% self-promotional content
- No URL shorteners (auto-removed by spam filter)

## Image Posts

- Image posts and self-posts are mutually exclusive
- Image posts: title + image only (no body text)
- Self-posts: Markdown body, images rendered as links only
- Gallery posts: up to 20 images
