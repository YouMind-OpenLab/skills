# YouMind Article Dispatch

One topic, every platform. AI-powered multi-platform content distribution hub.

---

## What Can It Do

| You say | Skill does |
|---------|------------|
| `Publish about AI agents on Dev.to, LinkedIn, and X` | Generates content brief, adapts for each platform, publishes to all three |
| `Write about Docker best practices for Dev.to and Hashnode` | Research, write, adapt tone/format per platform, publish as drafts |
| `Publish everywhere about the future of AI` | Dispatch to ALL configured platforms at once |

---

## Setup — One Key, All Platforms

All platform skills route through YouMind OpenAPI. You only need **one YouMind API key** — platform credentials (OAuth tokens, API keys, app passwords) are stored encrypted in YouMind after you connect each platform once.

### Step 1: Get YouMind API Key

1. Open [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch)
2. Create a key → copy the `sk-ym-xxxx` value
3. Put the key in `~/.youmind/config.yaml` once for all article skills

### Step 2: Connect Platforms in YouMind

Open [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-article-dispatch) and connect the platforms you use. Each platform has a one-click OAuth or credential paste flow — YouMind stores everything encrypted server-side.

| Platform | Skill | Connect in YouMind |
|----------|-------|--------------------|
| Dev.to | youmind-devto-article | OAuth in Connector Settings |
| Hashnode | youmind-hashnode-article | PAT in Connector Settings |
| WordPress | youmind-wordpress-article | Site URL + App Password in Connector Settings |
| Ghost | youmind-ghost-article | Site URL + Admin API Key in Connector Settings |
| LinkedIn | youmind-linkedin-article | OAuth in Connector Settings |
| X/Twitter | youmind-x-article | OAuth in Connector Settings |
| WeChat | youmind-wechat-article | AppID/AppSecret in Connector Settings |
| Qiita | youmind-qiita-article | OAuth in Connector Settings |

> **You do NOT store platform credentials locally.** Put only your YouMind API key in `~/.youmind/config.yaml`. YouMind proxies all platform API calls server-side.

---

## Installation

> Prerequisites: Node.js >= 18

```bash
cd youmind-article-dispatch
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

Dispatch itself needs no platform credentials — it's the routing hub. Shared YouMind credentials now live in `~/.youmind/config.yaml`, and article skills read only `~/.youmind/config.yaml` plus optional `~/.youmind/config/<skill>.yaml` overrides.

---

## YouMind Integration

Dispatch and all sub-skills integrate with the [YouMind](https://youmind.com) knowledge base for enhanced content creation.

### Knowledge Base Search

Search your YouMind library for related articles, notes, and bookmarks as research material. AI matches content semantically, not just by keywords.

### Web Search

Search the web for real-time information and trending topics. Automatically cite the latest data and trends when writing.

### Article Archiving

After publishing, save the article back to your YouMind knowledge base for future reference and repurposing.

### Material Mining

Browse boards and extract relevant materials from your YouMind workspace for content creation.

### Get API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch) to get your API Key, then fill it into the `youmind.api_key` field in `~/.youmind/config.yaml`.

---

## Usage Tips

### Distribution Strategy

- **Single platform**: Specify the platform name, e.g. `Write about X for Dev.to`
- **Multiple platforms**: List platform names, e.g. `Publish on Dev.to, LinkedIn, and Ghost`
- **All platforms**: Say `Publish everywhere`

### Content Adaptation

Dispatch doesn't just copy-paste. Each sub-skill adapts content to the platform:

- **Dev.to**: Technical depth, code examples, TL;DR at top
- **LinkedIn**: Professional angle, industry insights, concise paragraphs
- **Ghost**: Editorial newsletter content, member tiers, email-first distribution
- **WeChat**: Chinese localization, styled formatting, cover images
- **X/Twitter**: Distilled into tweet threads, hashtags
- **Qiita**: Japanese developer focus, GFM Markdown, environment info, note boxes

### Cross-Platform SEO

Use `canonical-url` to mark the original source and avoid duplicate content penalties from search engines.

---

## FAQ

**Q: If one platform fails, are others affected?**

No. Dispatch processes each platform independently. Failed platforms are marked in the final report; successful ones are unaffected.

**Q: How to publish to only some platforms?**

List the platform names in your prompt. Dispatch only calls the platforms you specify.

**Q: Do I need to install all sub-skills first?**

No. Only install and configure the skills for the platforms you actually use.

**Q: What's the publishing order?**

Dispatch publishes in the order you list them. For `Publish everywhere`, it follows the internal default order.

---

## License

MIT
