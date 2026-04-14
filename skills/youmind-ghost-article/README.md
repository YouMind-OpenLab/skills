# YouMind Ghost Skill

AI-powered Ghost article writing and publishing. Tell your agent a topic, and it can research, write, convert Markdown to HTML, upload images, and publish through the Ghost account you already connected in YouMind.

---

## What It Does

| You say | Skill does |
|---------|------------|
| `Write a Ghost post about AI agents` | Research -> write -> adapt -> publish as draft |
| `Publish this Markdown to Ghost` | Skip writing, convert and publish directly |
| `Validate my Ghost setup` | Check YouMind API key, paid-plan access, and Ghost connectivity |
| `List my Ghost drafts` | Fetch your Ghost drafts through YouMind |

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

Commands read `youmind.api_key` and `youmind.base_url` from local `config.yaml`.
Keep the documented domain as `https://youmind.com/openapi/v1`. If you need to test against a local `youapi`, change only your local `config.yaml`.

### Publishing prerequisite

Before publishing, connect your Ghost account inside YouMind. This skill no longer reads `ghost.site_url` or `ghost.admin_api_key` locally and should never ask the user to paste Ghost admin credentials into this repo.

### Get a YouMind API Key

Visit [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article), create a key, and place it in `youmind.api_key`.

---

## Usage Tips

### CLI Commands

```bash
cd toolkit

# Publish a markdown file as draft
npx tsx src/cli.ts publish article.md --draft

# Publish immediately
npx tsx src/cli.ts publish article.md --publish

# Preview HTML conversion locally
npx tsx src/cli.ts preview article.md

# Validate YouMind + Ghost connectivity
npx tsx src/cli.ts validate

# List posts
npx tsx src/cli.ts list --page 1 --limit 10

# List only drafts
npx tsx src/cli.ts list-drafts --page 1 --limit 10

# List only published posts
npx tsx src/cli.ts list-published --page 1 --limit 10

# Fetch a single post
npx tsx src/cli.ts get-post 69de04770c17b300017b5650

# Publish an existing draft by ID
npx tsx src/cli.ts publish-post 69de04770c17b300017b5650

# Move an existing post back to draft
npx tsx src/cli.ts unpublish-post 69de04770c17b300017b5650
```

### Draft Workflow

The skill publishes as draft by default. For drafts and scheduled posts, the CLI surfaces the Ghost Admin URL so the user can review the article in Ghost Admin immediately. If the user wants the article live right away, use `--publish` or `publish-post <id>`.

Local preview files now default to the skill's `output/` directory, which is already in `.gitignore`, so generated article artifacts do not pollute the repo.

### Paid Plan Requirement

Ghost OpenAPI now requires a paid YouMind plan (`Pro` / `Max`). If the current account is not eligible, the API returns `402` and points the user to [YouMind Pricing](https://youmind.com/pricing).

---

## FAQ

**Q: I get a 401 or auth error**

Check `youmind.api_key` in `config.yaml`. The skill now authenticates only with YouMind.

**Q: Publishing says Ghost is not connected**

Connect Ghost inside YouMind first. The Ghost site URL and Admin API key live there, not in `config.yaml`.

**Q: Can I still preview locally without a Ghost connection?**

Yes. `preview` only depends on the local Markdown-to-HTML conversion.

**Q: Can I explicitly publish or unpublish a post?**

Yes. The CLI and the YouMind Ghost OpenAPI now support `publish-post`, `unpublish-post`, `list-drafts`, and `list-published`.

**Q: What happens with feature images?**

The skill uploads a local feature image to Ghost through the YouMind Ghost OpenAPI before creating or updating the post.

---

## License

MIT
