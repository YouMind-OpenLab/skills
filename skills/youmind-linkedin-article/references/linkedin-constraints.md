# LinkedIn Platform Constraints

## Content Limits

| Element | Limit |
|---------|-------|
| Post text | 3,000 characters |
| Post with "see more" | ~210 characters before truncation |
| Article title | 100 characters (recommended) |
| Article body | No hard limit (recommended ≤3,000 words) |
| Comment | 1,250 characters |
| Hashtags per post | No hard limit (recommended 3–5) |
| Images per post | 1 (single image) or up to 20 (carousel/document) |

## API Specifics

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Text post | `POST /v2/ugcPosts` | UGC Share with NONE media |
| Image post | `POST /v2/ugcPosts` | Requires prior image upload |
| Article share | `POST /v2/ugcPosts` | ARTICLE media category |
| Image upload | `POST /v2/assets?action=registerUpload` + `PUT` binary | Two-step process |
| Profile | `GET /v2/me` | Basic profile info |

## OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `w_member_social` | Post, comment, react |
| `r_liteprofile` | Read basic profile |
| `r_emailaddress` | Read email |

**Important:** `w_member_social` requires LinkedIn app review for production use.

## Formatting Support

### Posts
- **Supported:** Line breaks, **bold** (native), mentions (@name), hashtags (#tag), links, emoji
- **NOT supported:** Markdown headers, code blocks, italic, bullet points (use emoji bullets)
- **Quirk:** LinkedIn auto-links URLs but may suppress reach for posts with links

### Articles
- **Supported:** Full HTML (h1-h6, p, strong, em, ul, ol, a, img, blockquote, code, table)
- **NOT supported:** Custom CSS, JavaScript, iframes, embedded media (except images)
- **Note:** Articles have their own URL and SEO — more permanent than posts

## Algorithm Notes

- Posts with images get 2–3x more reach than text-only
- Posts with external links get suppressed (add links in comments instead)
- First 60 minutes of engagement determine viral potential
- Comments > reactions for algorithmic boost
- Hashtags help discovery but don't affect existing network reach
