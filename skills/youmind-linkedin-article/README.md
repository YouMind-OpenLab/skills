# YouMind LinkedIn Skill

Publish professional LinkedIn posts with AI. Research, write, format, and publish -- all from one prompt.

---

## Quick Start

| You say | Skill does |
|---------|-----------|
| `Write a LinkedIn post about AI trends` | Research, write, format, publish to LinkedIn |
| `Publish this to LinkedIn: [text]` | Format and publish directly |
| `Write a company page post about our launch` | Publish to organization page |

---

## Install

> Requirements: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config file
cp config.example.yaml config.yaml
```

Fill in your credentials in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `linkedin.access_token` | **Yes** | OAuth 2.0 access token |
| `linkedin.person_urn` | **Yes** | Your LinkedIn person URN (urn:li:person:{id}) |
| `linkedin.organization_urn` | No | Company page URN for org posts |
| `youmind.api_key` | Recommended | For knowledge base search and web research |

## CLI Commands

```bash
# Publish a post
npx tsx src/cli.ts publish --text "Your post content" --visibility PUBLIC

# Preview formatted content
npx tsx src/cli.ts preview --file article.md

# Check profile info
npx tsx src/cli.ts profile

# Publish with image
npx tsx src/cli.ts publish --text "Post with image" --image cover.png
```

## LinkedIn API Setup

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create an app under your company page
3. Request OAuth scopes: `w_member_social`, `r_liteprofile`
4. Use the OAuth 2.0 flow to get an access token
5. Find your person URN via `GET /v2/userinfo`

## License

MIT
