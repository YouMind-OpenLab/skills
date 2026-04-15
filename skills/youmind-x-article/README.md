# YouMind X (Twitter) Skill

AI-powered tweet writing and publishing. Tell your agent a topic, and it can research, write, split long text into a numbered tweet sequence, and publish through the X account you already connected in YouMind.

---

## What It Does

| You say | Skill does |
|---------|------------|
| `Tweet about AI coding tools` | Research → write → adapt to 280 chars → publish tweet |
| `Write a thread about Docker best practices` | Research → write → split into numbered sequence → publish |
| `Tweet this: "Just shipped!"` | Format and publish directly |
| `Validate my YouMind setup` | Check the local API key |

---

## Setup

> Prerequisites: Node.js >= 18

```bash
# 1. Install dependencies
cd toolkit && npm install && npm run build && cd ..

# 2. Create config (if config.yaml doesn't exist)
cp config.example.yaml config.yaml
```

`config.yaml` only needs the YouMind API key:

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

Commands read `youmind.api_key` and `youmind.base_url` from local `config.yaml`. Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change only your local `config.yaml`.

### Publishing prerequisite

Before publishing, connect your X account inside YouMind (one-click OAuth 2.0). This skill no longer reads X Developer Portal credentials locally and should never ask the user to paste X API keys, bearer tokens, or OAuth 1.0a secrets into this repo.

### Get a YouMind API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-x-article), create a key, and place it in `youmind.api_key`.

---

## Usage Tips

### CLI Commands

Put local source Markdown under the skill's `output/` directory so it stays out of git status.

```bash
cd toolkit

# Publish a single tweet
npx tsx src/cli.ts tweet --text "Your tweet here"

# Publish a tweet with images (cdn.gooo.ai URLs only, up to 4)
npx tsx src/cli.ts tweet --text "Check this out" --image https://cdn.gooo.ai/user-files/pic.jpg

# Publish a numbered tweet sequence from a file
npx tsx src/cli.ts thread --file ../output/article.md

# Preview sequence splitting without posting
npx tsx src/cli.ts preview --file ../output/article.md --mode thread

# Preview a single tweet
npx tsx src/cli.ts preview --text "Check length" --mode tweet

# Validate YouMind credentials (local API key sanity check)
npx tsx src/cli.ts validate
```

### Tweet vs Thread

Short content goes out as a single tweet. Long content is split into numbered tweets (`1/N`) and published as a native X thread — the skill chains each tweet as a reply to the previous one via `replyToPostId`, so readers see a proper thread on your timeline.

### Images

Attach up to 4 images per tweet via `--image <url>...`. URLs must be under `https://cdn.gooo.ai/...` — YouMind enforces this allowlist server-side to avoid SSRF. Upload local files to YouMind first (via the YouMind product or AI image generation) and reference the resulting CDN URL here.

### Paid Plan

X publishing through YouMind does **not** require a paid plan today. (Other article-dispatch endpoints like `createTokenPlatformPost` do — those are for Ghost / WordPress / Dev.to / etc.)

---

## FAQ

**Q: I get a 401 or auth error**

Check `youmind.api_key` in `config.yaml`. The skill now authenticates only with YouMind.

**Q: Publishing says X is not connected**

Connect X inside YouMind first. The X access token and refresh token live there, not in `config.yaml`.

**Q: My image was rejected**

YouMind requires media URLs to be under `cdn.gooo.ai`. External URLs (Imgur, S3, etc.) are rejected with `X_MEDIA_HOST_NOT_ALLOWED`. Upload the image to YouMind first.

**Q: Can I still preview locally without an X connection?**

Yes. `preview` only runs the local adaptation logic and never calls YouMind.

---

## License

MIT
