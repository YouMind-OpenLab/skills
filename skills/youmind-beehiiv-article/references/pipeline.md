# Beehiiv Pipeline

## Step 1 — Load config

- Load `youmind.api_key` from `~/.youmind/config.yaml`
- Respect optional overrides from `~/.youmind/config/youmind-beehiiv-article.yaml`

## Step 2 — Validate account state

- Validate Beehiiv connection through YouMind
- Confirm the workspace has a usable Beehiiv connector and the right plan access
- If publish/send certainty matters, surface the Send API caveat early

## Step 3 — Gather source material

- Mine YouMind knowledge base when useful
- Use web search when current context matters
- If dispatch already provided `source_material`, reuse it and avoid duplicate mining

## Step 4 — Decide the publication object

Resolve these before drafting:
- draft or confirmed?
- web, email, or both?
- all readers, free tier, premium tier, or segmented audience?
- visible in feed or hidden?
- which post template, if any?
- what thumbnail / slug / SEO surface matters?
- what growth settings matter: capture type, social share placement

If the skill is being used for a recurring newsletter format, inspect templates before body work.

## Step 5 — Draft in Markdown

- Draft the post in Markdown first
- Save the local working draft to `~/.youmind/articles/beehiiv/<slug>.md` when useful
- Keep structure compact and edition-like, not search-first

## Step 6 — Convert to Beehiiv-safe HTML

- Convert Markdown to clean HTML unless the user explicitly needs native `blocks`
- Keep markup simple and email-safe
- Avoid layouts that only work well in browsers

## Step 7 — Publish via YouMind OpenAPI

Use:
- `validateConnection`
- `listPostTemplates` when template choice is relevant
- `createPost`
- `updatePost` / `getPost` / `listPosts` / `deletePost` when needed

Be explicit about:
- `status`
- `recipients`
- `emailSettings`
- `webSettings`
- `seoSettings`
- `postTemplateId`

## Step 8 — Return usable results

Always return:
- post ID
- title used
- current status
- web URL if available
- routing summary: web/email, feed visibility, audience/tier
- template used or skipped

If a direct public URL is not yet available:
- say that clearly
- include the best Beehiiv management note instead of implying a link exists
- surface any Send API / Enterprise / template caveats that affected the run
