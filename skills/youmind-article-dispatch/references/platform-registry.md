# Platform Registry — Detailed Reference

## Dev.to
- **Skill:** `youmind-devto-article`
- **API:** REST — `https://dev.to/api/articles`
- **Auth:** API Key (header: `api-key`)
- **Rate Limit:** 30 requests/30 seconds
- **Audience:** Software developers, open-source contributors, tech learners
- **Content format:** Native Markdown with YAML front matter
- **Constraints:** Max 100K chars, 4 tags max, cover_image URL required for best display
- **Tone:** Technical but accessible, tutorial-friendly, show-don't-tell
- **Best for:** Technical tutorials, tool reviews, dev experience posts, open-source showcases
- **Anti-patterns:** Marketing language, self-promotion, clickbait titles (community allergic)
- **Adaptation rules:**
  - Add YAML front matter (title, published, description, tags, cover_image, canonical_url)
  - Use code blocks with language tags — readers expect runnable examples
  - Include a TL;DR section for scanners
  - Structure: Problem → Solution → Code → Result

## Hashnode
- **Skill:** `youmind-hashnode-article`
- **API:** GraphQL — `https://gql.hashnode.com`
- **Auth:** Personal Access Token (Bearer header)
- **Rate Limit:** ~30 requests/minute
- **Audience:** Developer bloggers, tech writers, coding enthusiasts
- **Content format:** Markdown
- **Constraints:** No hard length limit, 5 tags max, cover image 1600x840 recommended
- **Tone:** Developer-friendly, blog-style, can be more personal
- **Best for:** In-depth technical blogs, tutorial series, developer stories, career reflections
- **Anti-patterns:** Shallow listicles without substance
- **Adaptation rules:**
  - Title: SEO-optimized, 50-70 chars
  - Use subtitle field for hook/teaser
  - Series support for multi-part content
  - Canonical URL for cross-posting

## WordPress
- **Skill:** `youmind-wordpress-article`
- **API:** REST — `https://{site}/wp-json/wp/v2/`
- **Auth:** Application Passwords (Basic Auth)
- **Rate Limit:** Server-dependent
- **Audience:** General — depends on the specific WordPress site
- **Content format:** HTML (converted from Markdown)
- **Constraints:** No hard length limit, categories + tags, featured image via media upload
- **Tone:** Adaptable to site's existing voice
- **Best for:** SEO-focused long-form articles, company blogs, knowledge bases
- **Anti-patterns:** Ignoring existing site taxonomy (categories/tags)
- **Adaptation rules:**
  - Convert Markdown to clean HTML
  - Match existing site categories and tags
  - Upload featured image via media endpoint
  - Excerpt: 150-300 chars
  - Default to draft status

## Ghost
- **Skill:** `youmind-ghost-article`
- **API:** Admin API — `https://{site}/ghost/api/admin/`
- **Auth:** JWT from Admin API Key (id:secret → HMAC-SHA256)
- **Rate Limit:** ~100 requests/minute
- **Audience:** Newsletter subscribers, premium content consumers, publication readers
- **Content format:** HTML (with `?source=html`) or Mobiledoc
- **Constraints:** Primary + secondary tags, custom excerpt, feature image
- **Tone:** Editorial, publication-quality, polished
- **Best for:** Newsletter content, premium publications, editorial pieces
- **Anti-patterns:** Overly casual tone, unformatted content
- **Adaptation rules:**
  - Title: clean, publication-style
  - Custom excerpt: 150-300 chars
  - Use HTML input with `?source=html` (simplest approach)
  - Upload feature image to Ghost CDN
  - Default to draft status

## Beehiiv
- **Skill:** `youmind-beehiiv-article`
- **API:** YouMind OpenAPI -> Beehiiv REST
- **Auth:** Beehiiv API Key + Publication ID stored in YouMind
- **Audience:** Newsletter operators, creator businesses, editorial growth teams
- **Content format:** HTML
- **Constraints:** Subject-style headline, preview text, Send API access may gate createPost
- **Tone:** Newsletter-native, direct, polished
- **Best for:** Weekly updates, launch notes, operator essays, growth recaps
- **Anti-patterns:** SEO sludge, giant intros, embed-heavy markup
- **Adaptation rules:**
  - Strong title + compact subtitle
  - HTML must stay simple and email-safe
  - Default to draft
  - Surface Send API caveat if publish must be guaranteed

## Kit
- **Skill:** `youmind-kit-article`
- **API:** YouMind OpenAPI -> Kit v4 REST
- **Auth:** Kit API Key stored in YouMind
- **Audience:** Creators, newsletter operators, audience-building teams
- **Content format:** HTML
- **Constraints:** Subject + preview text matter as much as body, public/private mode, scheduled send supported
- **Tone:** Creator-note style, concise, conversational but sharp
- **Best for:** Broadcasts, weekly digests, creator updates, product notes
- **Anti-patterns:** Over-designed blog layouts, bloated intros, hard-sell copy
- **Adaptation rules:**
  - Optimize first screen for feed + inbox scanning
  - Keep sections compact
  - Default to public web mode unless user asks otherwise
  - Use clean HTML only

## X/Twitter
- **Skill:** `youmind-x-article`
- **API:** API v2 — `https://api.x.com/2/`
- **Auth:** OAuth 2.0 (PKCE) or OAuth 1.0a
- **Rate Limit:** 1,500 tweets/month (Free), more on paid tiers
- **Audience:** General, viral-content seekers, news followers
- **Content format:** Plain text with optional media
- **Constraints:** 280 chars/tweet (25K for X Premium long-form), 4 images, 1 video
- **Tone:** Punchy, conversational, hot-take-friendly, authentic
- **Best for:** Hot takes, thread breakdowns, breaking news commentary, thought starters
- **Anti-patterns:** Links in tweet body (kills algorithm reach), excessive hashtags (>2)
- **Adaptation rules:**
  - Single tweet: 280 chars max, hook-driven
  - Thread mode: numbered tweets (1/N), each self-contained
  - 1-2 hashtags maximum
  - Media (images) for higher reach
  - Thread splitting: split on paragraph boundaries, each tweet standalone

## WeChat
- **Skill:** `youmind-wechat-article` (existing)
- **API:** WeChat Official Account API
- **Auth:** AppID + AppSecret
- **Audience:** Chinese general audiences, WeChat ecosystem users
- **Content format:** Styled HTML with CSS themes
- **Best for:** Long-form articles with rich formatting, brand content, knowledge sharing
- See the `youmind-wechat-article` skill for full details.

## Qiita
- **Skill:** `youmind-qiita-article`
- **API:** REST v2 — `https://qiita.com/api/v2`
- **Auth:** Personal Access Token (Bearer header), scope: `write_qiita`
- **Rate Limit:** 1,000 requests/hour (authenticated)
- **Audience:** Japanese software developers, engineering teams, tech learners
- **Content format:** GitHub Flavored Markdown with Qiita extensions (note boxes, math, Mermaid)
- **Constraints:** At least 1 tag required, max 5 recommended, tags are free-form and case-sensitive
- **Tone:** Knowledge-sharing, technical, humble, peer-to-peer
- **Best for:** Technical tutorials, development notes, tool reviews, learning memos, team knowledge sharing
- **Anti-patterns:** Marketing language, untested code, missing environment info, copy-paste from docs without insights
- **Adaptation rules:**
  - Include environment section (OS, language/framework versions, tools)
  - Code blocks must have language tags; use `python:filename.py` syntax for filenames
  - Use Qiita note boxes (`:::note info/warn/alert`) for callouts
  - Match user's language (Japanese or English)
  - Default to private mode (limited sharing) for safety
  - Use existing popular tags: `Python`, `JavaScript`, `TypeScript`, `Docker`, `React`, `AWS`, `機械学習`, `初心者`
