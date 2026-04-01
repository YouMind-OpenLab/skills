# youmind-instagram-article

AI-powered Instagram post and carousel publisher. Transforms articles and topics into Instagram-native visual content with optimized captions, hashtag strategies, and automated two-step publishing via the Instagram Graph API.

**IMPORTANT: Instagram requires images for every post. Text-only posting is not possible.**

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
- `instagram.business_account_id` — Your Instagram Business Account ID
- `instagram.access_token` — Facebook Page Access Token with instagram_basic + instagram_content_publish permissions

## CLI Usage

```bash
cd toolkit

# Validate credentials
npx tsx src/cli.ts validate

# Publish a single image post
npx tsx src/cli.ts publish "Your caption here" --image-url https://example.com/photo.jpg

# Publish a carousel
npx tsx src/cli.ts carousel "Carousel caption" --images https://img1.jpg https://img2.jpg https://img3.jpg

# Preview a caption
npx tsx src/cli.ts preview "Your draft caption"

# List recent media
npx tsx src/cli.ts list

# Check container processing status
npx tsx src/cli.ts status <container_id>
```

## Instagram Two-Step Publishing

Instagram uses a two-step publish flow:

1. **Create Container**: Upload image(s) and caption to create a media container
2. **Poll Status**: Wait for Instagram to process the media (status: `FINISHED`)
3. **Publish**: Publish the processed container to make it live

For carousels, each image is first uploaded as a child container, then combined into a carousel container before publishing.

## Getting Instagram Credentials

1. Link your Instagram Business/Creator Account to a Facebook Page
2. Create an app at [Meta for Developers](https://developers.facebook.com/)
3. Add the Instagram Graph API product
4. Generate a token with `instagram_basic` + `instagram_content_publish` permissions
5. Query `GET /{page_id}?fields=instagram_business_account` for your IG Business Account ID

## License

MIT
