# Operations Reference

> Read this file when handling post-publish commands, standalone formatting, analytics,
> client onboarding, edit learning, custom themes, or first-run setup.

---

## Post-Publish Commands

| User says | Action |
|-----------|--------|
| Polish / shorten / expand / change tone | Edit the article (see writing-guide.md edit section) |
| Change cover to warm tones | Modify cover prompt, regenerate |
| Change image style to illustrated / cinematic / minimal / etc. | Re-run Step 6 with the new style direction |
| Remove the Nth inline image | Remove that image from the Markdown |
| Rewrite with framework B | Return to Step 4 with the new framework |
| Switch to a different topic | Return to Step 3, show the topic list |
| Preview with a different theme/color | Re-run Step 7 with the preview command |
| Show article stats / performance review | Fetch stats and analyze (see Performance Review below) |
| List all themes | Run `cli.js themes` |
| Create new client | Run client onboarding flow (see below) |
| Learn from my edits | Run learn-from-edits flow (see below) |
| Search my materials / knowledge base | Run `youmind-api.js search` |
| Write from my notes / based on this doc | Read the specific material and use as primary source in Step 4 |

---

## Standalone Formatting

When the user provides Markdown only (no writing pipeline needed): use `cli.js preview` or `cli.js publish` directly. Use `cli.js theme-preview` for a 4-theme comparison. See `cli-reference.md` for full syntax.

---

## Performance Review

When the user asks about article stats: fetch with `fetch-stats.js`, backfill history.yaml, then analyze:

1. **Top performer:** Which article did best? Why? (title strategy, topic heat, framework, timing)
2. **Underperformer:** Which article lagged? Root cause hypothesis.
3. **Adjustments:** Specific changes for the next article's topic selection, title strategy, or framework choice.

---

## Client Onboarding

When user says "create new client", "import articles", or "build playbook":

1. Create `clients/{client}/` with: `style.yaml` (copy from demo), `corpus/`, `history.yaml` (empty), `lessons/` (empty).
2. If corpus contains ≥20 articles, run `build-playbook.js`.

---

## Learn From Human Edits

Run `learn-edits.js` with the draft and final versions. Categorizes changes: word choice, paragraph additions/deletions, structure adjustments, title revisions, tone shifts.

Every 5 accumulated lessons triggers a playbook refresh with `--summarize`.

---

## Custom Themes (Progressive Disclosure)

When needs exceed the 10 built-in themes, escalate through three levels:

**Level 1 — Simple tweaks** (e.g., "change the color", "make the font bigger"):
Adjust CLI arguments on built-in themes. Run `cli.js themes` / `cli.js colors` to see options.

**Level 2 — Style-driven customization** (e.g., "tech-futuristic", "literary and clean", "formal business"):
Read `theme-dsl.md` and generate a custom theme JSON. Reference `builtin-themes.json` for CSS examples. Save to `clients/{client}/themes/` and use `--custom-theme`.

**Level 3 — Deep design** (e.g., "design something truly special for this theme"):
Check if Impeccable is installed (`.claude/skills/frontend-design`). If not, suggest:
> For higher design quality, consider installing Impeccable: `npx skills add pbakaus/impeccable --yes`

When installed, use `/colorize`, `/typeset`, `/quieter`, `/bolder` as needed.

---

## First-Run Setup

If `config.yaml` does not exist when the skill triggers:

1. Copy `config.example.yaml` to `config.yaml`
2. Ask the user for WeChat `appid` and `secret` (required for publishing)
3. Ask about optional integrations: YouMind API key, image generation provider keys
4. Run `cd toolkit && npm install` if `node_modules/` is missing
5. **Configure WeChat IP whitelist** (required for API access — see below)

Store the configuration once; never ask again.

### WeChat IP Whitelist Configuration

The WeChat Official Account API **rejects all requests from IPs not on the whitelist**. This must be configured before publishing can work.

**Step 1 — Get the user's public IP:**

```bash
curl -s https://httpbin.org/ip | python3 -c "import sys,json; print(json.load(sys.stdin)['origin'])"
```

Run this command and show the IP to the user.

**Step 2 — Add IP to WeChat whitelist:**

Guide the user to:

1. Open [WeChat Official Account Console](https://mp.weixin.qq.com) → Settings & Development → Basic Configuration
2. Find the **IP Whitelist** section
3. Click Edit, add the IP from Step 1
4. Save

> **Note:** If the user's IP is dynamic (common for home networks), it may change periodically. When publishing suddenly fails with an IP-related error, re-run the curl command and update the whitelist.
>
> Cloud servers and CI/CD environments typically have static IPs — configure once and forget.
