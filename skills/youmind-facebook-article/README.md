# youmind-facebook-article

AI-powered Facebook Page post publisher. Researches topics via YouMind knowledge base, adapts content for Facebook's engagement-driven format, and publishes directly to your Page via Graph API.

## Quick Start

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
# Fill in your API keys in config.yaml
```

## Configuration

Copy `config.example.yaml` to `config.yaml` and fill in:

- `youmind.api_key` — YouMind API key for knowledge base and web search
- `facebook.page_id` — Your Facebook Page ID
- `facebook.page_access_token` — Long-lived Page Access Token

## CLI Usage

```bash
cd toolkit

# Validate credentials
npx tsx src/cli.ts validate

# Publish a text post
npx tsx src/cli.ts publish "Your post content here"

# Publish with a link
npx tsx src/cli.ts publish "Check out this article" --link https://example.com

# Publish with an image
npx tsx src/cli.ts publish "Great photo!" --with-image https://example.com/photo.jpg

# Preview formatted post
npx tsx src/cli.ts preview "Your draft post content"

# List recent posts
npx tsx src/cli.ts list
```

## Getting a Facebook Page Access Token

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select an app
3. Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
4. Select your Page and grant `pages_manage_posts` and `pages_read_engagement` permissions
5. Generate a long-lived Page Access Token

## License

MIT
