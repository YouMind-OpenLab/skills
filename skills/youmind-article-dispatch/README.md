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

## Getting Credentials

Dispatch calls each platform's sub-skill. Each sub-skill requires its own credentials:

| Platform | Skill Name | Key Credential | Where to Get |
|----------|------------|----------------|--------------|
| Dev.to | youmind-devto-article | API Key | <https://dev.to/settings/extensions> |
| Hashnode | youmind-hashnode-article | Personal Access Token | <https://hashnode.com/settings/developer> |
| WordPress | youmind-wordpress-article | Application Password | WordPress Admin > Users > Profile |
| Ghost | youmind-ghost-article | Admin API Key | Ghost Admin > Integrations |
| LinkedIn | youmind-linkedin-article | OAuth 2.0 Access Token | <https://developer.linkedin.com/> |
| X/Twitter | youmind-x-article | OAuth Token | <https://developer.x.com/en/portal> |
| Reddit | youmind-reddit-article | Client ID/Secret | <https://www.reddit.com/prefs/apps> |
| Facebook | youmind-facebook-article | Page Access Token | <https://developers.facebook.com/> |
| Instagram | youmind-instagram-article | Business Account Token | <https://developers.facebook.com/> |
| Medium | youmind-medium-article | Integration Token | <https://medium.com/me/settings/security> |
| WeChat | youmind-wechat-article | AppID/Secret | <https://mp.weixin.qq.com/> |

> **Tip**: You only need to configure the platforms you use. Dispatch automatically skips unconfigured ones.

---

## Installation

> Prerequisites: Node.js >= 18

```bash
cd youmind-article-dispatch
cp config.example.yaml config.yaml
```

Dispatch itself needs no platform credentials — it's the routing hub. Each sub-skill has its own config.

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

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch) to get your API Key, then fill it into the `youmind.api_key` field in `config.yaml`.

---

## Usage Tips

### Distribution Strategy

- **Single platform**: Specify the platform name, e.g. `Write about X for Dev.to`
- **Multiple platforms**: List platform names, e.g. `Publish on Dev.to, LinkedIn, and Medium`
- **All platforms**: Say `Publish everywhere`

### Content Adaptation

Dispatch doesn't just copy-paste. Each sub-skill adapts content to the platform:

- **Dev.to**: Technical depth, code examples, TL;DR at top
- **LinkedIn**: Professional angle, industry insights, concise paragraphs
- **Medium**: Narrative storytelling, elegant formatting, compelling hook
- **WeChat**: Chinese localization, styled formatting, cover images
- **X/Twitter**: Distilled into tweet threads, hashtags

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
