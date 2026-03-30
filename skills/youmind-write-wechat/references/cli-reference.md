# CLI Reference

All commands run from `{skill_dir}/toolkit/`.

---

## Core Commands

### Preview (opens browser)

```bash
node dist/cli.js preview {markdown_path} \
  --theme {theme_key} --color "{hex}" \
  [--font {font}] [--font-size {size}] \
  [--heading-size {size}] [--paragraph-spacing {spacing}] \
  [--custom-theme {theme_json_path}] \
  [--no-open] [-o {output_html_path}]
```

### Publish to WeChat Drafts

```bash
node dist/cli.js publish {markdown_path} \
  --theme {theme_key} --color "{hex}" \
  [--cover {cover_image_path}] [--title "{title}"] \
  [--font {font}] [--font-size {size}] \
  [--heading-size {size}] [--paragraph-spacing {spacing}] \
  [--custom-theme {theme_json_path}]
```

Parameter priority: `--custom-theme` > CLI args > `style.yaml` values > defaults

### Theme Comparison Preview

```bash
node dist/cli.js theme-preview {markdown_path} --color "{hex}"
```

Generates a side-by-side preview of all 4 themes with the given color.

### List Themes and Colors

```bash
node dist/cli.js themes
node dist/cli.js colors
```

---

## Image Generation

```bash
# AI-generated image
node dist/image-gen.js --prompt "{prompt}" \
  --output {output_path} --size {cover|article} \
  [--color "{hex}"] [--mood "{mood}"] [--provider {youmind|gemini|openai|doubao}]

# Search Nano Banana Pro library
node dist/image-gen.js --search "{keywords}" --output {output_path}

# Fallback: match a predefined cover by color
node dist/image-gen.js --fallback-cover --color "{hex}" --output {output_path}
```

Three-level fallback chain: API generation → Nano Banana library match → predefined covers from remote CDN → prompt-only output.

---

## YouMind Knowledge Base

```bash
# Mine topics from the knowledge base
node dist/youmind-api.js mine-topics "{topics_csv}" \
  [--board "{board_id}"] [--top-k 10]

# Search the knowledge base
node dist/youmind-api.js search "{query}"

# Web search (freshness-filtered)
node dist/youmind-api.js web-search "{query}" [--freshness day]

# Get full content of a material or craft
node dist/youmind-api.js get-material "{id}"
node dist/youmind-api.js get-craft "{id}"

# Save an article to the knowledge base
node dist/youmind-api.js save-article "{board_id}" \
  --title "{title}" --file "{markdown_path}"
```

---

## Python Scripts

```bash
# Fetch trending topics (Weibo + Toutiao + Baidu)
python3 {skill_dir}/scripts/fetch_hotspots.py --limit 30

# Score keywords for SEO potential
python3 {skill_dir}/scripts/seo_keywords.py --json "keyword1" "keyword2" "keyword3"
```

---

## Analytics and Learning

```bash
# Fetch article stats and backfill history.yaml
node dist/fetch-stats.js --client {client} --days 7

# Analyze human edits and extract lessons
node dist/learn-edits.js --client {client} --draft {draft_path} --final {final_path}

# Summarize accumulated lessons into a playbook refresh
node dist/learn-edits.js --client {client} --summarize

# Build playbook from corpus (minimum 20 articles, 50+ recommended)
node dist/build-playbook.js --client {client}
```

---

## Skill Maintenance

```bash
# Validate the skill's structure, metadata, and documentation links
python3 ../scripts/validate_skill.py
```
