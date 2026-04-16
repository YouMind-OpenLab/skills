# Resilience — Never Stop on a Single-Step Failure

## Principle

The WeChat article pipeline is multi-step. Failures in one step must not cascade into the whole run. Every step has a fallback. If a step AND its fallback both fail, skip that step, note it in the final output, and continue.

**Golden rule:** Partial delivery > no delivery. The user can always fix individual pieces manually after the run.

## Per-step fallback chain

| Step | Action | Fallback if step fails | Fallback of fallback |
|------|--------|----------------------|---------------------|
| 1 | Load config + validate | Prompt user to fix `config.yaml` | — |
| 1.5 | Knowledge mining (YouMind KB) | Empty `knowledge_context`, continue | — |
| 2 | Trending topics (`fetch_hotspots.py`) | YouMind web-search | WebSearch tool → ask user |
| 2.5 | SEO keyword scoring | Self-estimate, mark results as "estimated" | Skip scoring |
| 3 | Topic generation | Ask user for a manual topic | — |
| 3.5 | Framework selection | Default to first framework from `frameworks.md` | — |
| 4 | Writing (with depth + de-AI) | Partial article + flag for user review | Ask user for content |
| 5 | SEO + de-AI pass | Apply minimum rules, flag pending refinements | — |
| 6 | Image generation | Nano Banana Pro library match | CDN predefined cover → prompt-only output |
| 7 | **Publishing to WeChat drafts** | Generate local HTML preview | Save markdown in `output/` |
| 7.5 | History + archive | Log warning, continue | — |

## What "skip and note" looks like

When a step is skipped, the final report MUST include a clear note:

```
✅ Completed: Steps 1-5, 7-8
⚠️  Skipped: Step 6 (image generation) — YouMind API + library both returned no match
📝 Manual action: add cover image via WeChat editor before scheduled push
```

## Environmental failures

| Missing dependency | Recovery action |
|-------------------|-----------------|
| Node.js | Tell user: `brew install node` or nvm install |
| Python 3.9+ | Tell user: `brew install python@3.11` |
| `dist/` not built | Run `npm run build` automatically |
| `output/` missing | Create it (`mkdir -p output`) |

## Anti-pattern: the "broken pipeline halt"

Stopping the entire flow because one step failed is the #1 anti-pattern in operating this skill. Always use the fallback. If the fallback fails, skip and note — never halt the whole pipeline.

See also: `references/gotchas.md` for content quality anti-patterns.
