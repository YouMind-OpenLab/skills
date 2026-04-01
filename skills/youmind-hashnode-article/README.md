# YouMind Hashnode Skill

AI-powered Hashnode article writing and publishing. Tell your agent a topic, it handles research, writing, SEO optimization, and publishing to your Hashnode publication.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Write a Hashnode article about Rust async/await` | Full pipeline: research -> write -> SEO optimize -> publish as draft |
| `Publish this markdown to Hashnode` | Skip writing, format and publish directly |
| `Validate my article for Hashnode` | Check tags, structure, SEO metadata |
| `List my Hashnode posts` | Fetch and display your published and draft posts |

---

## Getting Credentials

### Step 1 -- Sign Up and Create a Publication (Blog)

> If you already have a Hashnode blog, skip to Step 2.

1. Go to [Hashnode](https://hashnode.com) and sign up or log in
2. After logging in, visit the [Onboarding page](https://hashnode.com/onboard) and follow the prompts to create your blog (Publication)
3. Choose a blog name and domain (Hashnode provides a free `*.hashnode.dev` subdomain)
4. Once complete, you'll land on your blog Dashboard

> **Note**: Hashnode requires a Publication before you can publish articles. Without one, the API cannot publish content.

### Step 2 -- Get a Personal Access Token

> Hashnode developer settings: <https://hashnode.com/settings/developer>

1. Click your avatar (top-right) -> **Account Settings** -> select **Developer** from the left menu
2. Direct link: <https://hashnode.com/settings/developer>
3. Click the **"Generate New Token"** button
4. Enter a token name (e.g., `youmind`)
5. Copy the generated Personal Access Token (shown only once -- save it immediately)

### Step 3 -- Get Your Publication ID

Your Publication ID can be obtained via:

- **Method 1 -- Blog Dashboard URL**: Open your Hashnode blog Dashboard. The URL format is `https://hashnode.com/dashboards/{publication_id}/general` -- the `{publication_id}` part is what you need
- **Method 2 -- GraphQL API query**: Execute the following query in the [API Playground](https://gql.hashnode.com) (you need to enter your Token in the Playground first):

```graphql
query {
  me {
    publications(first: 10) {
      edges {
        node {
          id
          title
          url
        }
      }
    }
  }
}
```

> **If the query returns empty results**: You haven't created a Publication yet -- go back to Step 1.

### Step 4 -- Fill in Config

Paste the token and publication ID into `config.yaml`:

```yaml
hashnode:
  token: "your-personal-access-token-here"
  publication_id: "your-publication-id-here"
```

---

## Installation

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config (if config.yaml doesn't exist)
cp config.example.yaml config.yaml

# 3. Fill in API keys in config.yaml
```

Required fields in `config.yaml`:

| Field | Required | Description |
|-------|----------|-------------|
| `hashnode.token` | **Yes** | Hashnode Personal Access Token, see steps below |
| `hashnode.publication_id` | **Yes** | Your Hashnode Publication ID |
| `youmind.api_key` | Recommended | For knowledge base search, web search, article archiving -> [Get API Key](https://youmind.com/settings/api-keys?utm_source=youmind-hashnode-article) |

---

## YouMind Integration

The Hashnode Skill integrates with the [YouMind](https://youmind.com) knowledge base for enhanced content creation.

### Knowledge Base Search

Search your YouMind library for related articles, notes, and bookmarks as research material. AI matches content semantically, not just by keywords.

### Web Search

Search the web for real-time information and trending topics. Automatically cite the latest data and trends when writing.

### Article Archiving

After publishing, save the article back to your YouMind knowledge base for future reference and repurposing.

### Material Mining

Browse boards and extract relevant materials from your YouMind workspace for content creation.

### Get API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys) to get your API Key, then fill it into the `youmind.api_key` field in `config.yaml`.

---

## Usage Tips

### Hashnode Content Guidelines

- **Title**: 50-70 characters, SEO-optimized, keywords front-loaded
- **Subtitle**: Compelling hook -- Hashnode highlights it prominently
- **Tags**: Up to 5, must be selected from Hashnode's existing tag library
- **Cover image**: Recommended 1600x840 pixels, referenced via URL
- **Canonical URL**: Essential for cross-platform publishing to avoid SEO duplicate content penalties
- **Meta description**: Up to 160 characters, used for search engines

### CLI Commands

```bash
cd toolkit

# Publish a markdown file
npx tsx src/cli.ts publish article.md --tags "graphql,api"

# Preview and validate locally
npx tsx src/cli.ts preview article.md

# Validate API connectivity
npx tsx src/cli.ts validate

# List your posts
npx tsx src/cli.ts list
```

### Hashnode-Specific Features

- **Custom domain**: Hashnode supports binding your blog to a custom domain
- **Article series**: Organize multiple articles into a series
- **Newsletter**: Publish and simultaneously send email notifications to subscribers
- **GraphQL API**: Hashnode uses a GraphQL API -- powerful and flexible

---

## FAQ

**Q: Token invalid or 401 error**

Double-check the `hashnode.token` in `config.yaml`. If the token expired or was revoked, regenerate it at <https://hashnode.com/settings/developer>.

**Q: Where to find the Publication ID?**

Easiest way: use the `validate` command, which auto-fetches and displays your Publication ID. Or query it in the Hashnode API Playground (<https://gql.hashnode.com>).

**Q: Tag doesn't exist**

Hashnode tags must be selected from the existing tag library. The skill auto-validates and suggests matching tags.

**Q: How to edit after publishing?**

You can update articles via the Hashnode GraphQL API, or edit directly in the Hashnode Dashboard.

**Q: How to set the cover image?**

Add `coverImageURL` in the Markdown front matter, or tell the skill the cover image URL you want in the prompt.

---

## License

MIT
