# Kit Pipeline

## Step 1 — Load config

- Load `youmind.api_key` from `~/.youmind/config.yaml`
- Respect optional overrides from `~/.youmind/config/youmind-kit-article.yaml`

## Step 2 — Validate account state

- Validate Kit connection through YouMind
- Confirm account identity, sender email, and creator profile availability
- If publish is requested and sender email is not confirmed, stop and explain why

## Step 3 — Gather source material

- Mine YouMind knowledge base when useful
- Use web search when the topic needs current context
- If dispatch already provided `source_material`, use it and avoid duplicate mining

## Step 4 — Decide broadcast shape

Resolve these before drafting:
- Public or private?
- Is this web-only style, or should it read like a real inbox send?
- Which email template fits best?
- Does the public feed / creator profile matter for this post?

## Step 5 — Draft in Markdown

- Draft the broadcast in Markdown first
- Save the local working draft to `~/.youmind/articles/kit/<slug>.md` when useful
- Keep section count low and CTA count to one

## Step 6 — Convert to HTML

- Convert Markdown to clean HTML
- Keep markup simple and email-safe
- Avoid layout tricks that depend on browser rendering only

## Step 7 — Publish via YouMind OpenAPI

Use:
- `validateConnection`
- `listEmailTemplates` when template choice is unclear
- `createBroadcast`
- `updateBroadcast` / `getBroadcast` / `listBroadcasts` / `deleteBroadcast` when needed

## Step 8 — Return usable results

Always return:
- broadcast ID
- subject/title used
- visibility mode
- public URL if available
- fallback management path

If public URL is missing:
- private → point to `https://app.kit.com/campaigns`
- public → tell the user to open the Broadcast report page in Kit and click `Open`
