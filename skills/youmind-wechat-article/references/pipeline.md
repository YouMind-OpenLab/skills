# Pipeline Execution Detail

> Read this file when running the full writing pipeline (Steps 1–8).
> For CLI command syntax, see `cli-reference.md`.

---

## Step 1: Load Client Configuration

Read `{skill_dir}/clients/{client}/style.yaml`.

**Routing:**
- Client directory does not exist → Tell user to reference `references/style-template.md`. Do NOT create it yourself.
- User provided a specific topic (e.g., "write about AI Agents") → Skip Steps 2–3, go to Step 1.5 → Step 3.5
- User provided raw Markdown for formatting only → Skip to Step 7

## Step 1.5: YouMind Knowledge Mining

> Only runs when `~/.youmind/config.yaml` contains `youmind.api_key`. Otherwise skip.

Use `youmind-api.js mine-topics` with the client's topics and source boards. Keep the top 10 results as `knowledge_context` for use in Steps 3 and 4.

Topics that match knowledge base material receive a +1 scoring boost (flag: "has knowledge base support").

**[Fallback]:** API error → skip, set `knowledge_context` to empty.

## Step 2: Trending Topic Fetch

Run `fetch_hotspots.py`. Tag each result with its domain and a creatability score (1–10). Filter out items unrelated to the client's topics.

**[Fallback]:** Script error → YouMind `web-search` → `WebSearch` → ask user for a topic.

## Step 2.5: Dedup + SEO (Parallel)

Run two tasks simultaneously:

1. Read `history.yaml` — extract `topic_keywords` from the last 7 days for dedup. Note characteristics of top-performing articles if stats exist.
2. Run `seo_keywords.py` on 3–5 keywords extracted from trending titles.

**[Fallback]:** SEO script error → self-estimate scores, mark as "estimated."

## Step 3: Topic Generation

Read `references/topic-selection.md`. Generate **10 topics** using the 5-dimension evaluation model (Heat, Audience Fit, Angle Value, Engagement Potential, Insight Potential).

- **Each topic MUST include an Atomic Insight draft** — 1-2 sentences stating the core insight the article could deliver. This is the most important field. If you can't draft one, the topic is too shallow.
- Apply the **Topic Sharpening process** (generic → specific → tense → urgent → insight) to all candidates.
- Knowledge boost: matching `knowledge_context` items → +1, flag "has knowledge base support"
- Dedup penalty: overlapping with last 7 days → −2, flag "recently covered"
- **Auto mode:** Select the highest scorer and continue.
- **Interactive mode:** Output all 10 in a formatted table and wait for selection.

## Step 3.5: Framework Selection

Read `references/frameworks.md`. Generate **5 framework proposals** (Pain-Point / Story / Listicle / Comparison / Hot Take / Exposé), each with: opening strategy, emotional arc shape, H2 outline, golden quote placement, closing approach, and recommendation score.

If history stats show a particular framework overperforms for this audience, bias toward it.

- **Auto mode:** Select the highest-rated proposal and continue.
- **Interactive mode:** Present all 5 and wait for selection.

## Step 4: Article Writing

Read `references/writing-guide.md` and `clients/{client}/playbook.md` (if it exists).

**Before writing, complete the Pre-Writing Thinking Framework** (in `<thinking>` tags — see writing-guide.md). This MUST include identifying the **Atomic Insight** — the ONE thing the reader will tell a friend over dinner. If you can't state it in one sentence, go back to topic selection.

**Design the Emotional Architecture** (see writing-guide.md "Emotional Architecture" section). Choose one of the 5 emotional shapes and map the arc before writing. The article must have a clear emotional peak at 60-70% of the way through.

**Knowledge integration:** If `knowledge_context` contains relevant items, use `youmind-api.js get-material` / `get-craft` to read the full content. Extract facts, data points, and unique perspectives. Attribute naturally within the article. Do NOT copy-paste.

**Hard rules:** Follow the selected framework structure. Apply writing-guide craft principles throughout. H1 title 20–28 characters. Word count 1,500–2,500. No banned words from writing-guide or client blacklist. Place golden quotes at framework-specified positions. Match client voice and tone. Apply Chinese Writing Mastery techniques (转折, 对仗不对称, 留白, 口语切入). Do NOT insert image placeholders (Step 6 handles images).

**Self-check (three passes, in this order):**
1. **Depth Checklist** (writing-guide.md "Depth Architecture" section): Does the article hit Level 3 on the "So What?" ladder at least twice? Does it contain at least one genuinely surprising insight? Would it still be worth reading with all formatting stripped?
2. **Screenshot Test** (writing-guide.md): Is there at least one paragraph good enough to screenshot and send to a friend? If not, the article lacks density — sharpen.
3. **Voice Verification** (writing-guide.md Level 4): De-AI check, rhythm variation, specificity, structural variation, asymmetric parallelism.

If any self-check fails — **rewrite the weak sections before proceeding**. Do NOT proceed to Step 5 with a shallow draft.

Save to: `{skill_dir}/output/{client}/{YYYY-MM-DD}-{slug}.md`

## Step 5: SEO Optimization + De-AI Pass

Read `references/seo-rules.md`. Execute ALL 6 optimizations:

1. **Title optimization:** Generate 3 alternatives using different strategies. Select the best.
2. **Keyword density:** Core keyword in the first 200 characters, 3–5 natural occurrences total.
3. **De-AI deep pass:** Full 4-level protocol. Scan every paragraph. Replace every banned word, break every parallel structure, inject cognitive imperfection.
4. **Digest:** ≤54 characters with core keyword + curiosity hook. Must NOT repeat the title.
5. **Tags:** 5 tags (2 industry + 2 trending + 1 long-tail). Specific beats broad.
6. **Completion rate check:** Verify paragraph lengths, hook intervals, and rhythm variation. Fix flat sections.

Overwrite the file with the optimized version.

## Step 6: Visual AI

Read `references/visual-prompts.md`.

### 6a. Ask user about image needs

This question is mandatory unless the user has already specified image scope and style.

Preferred path: use `AskUserQuestion` when the host provides it.

Ask two things:

1. **Image scope**
   - `cover + inline images` (recommended)
   - `cover only`
   - `inline only`
   - `no images`
2. **Style direction**
   - `follow article tone` (recommended default)
   - or a user-specified look such as illustrated / cinematic / minimal / tech / warm editorial

If `AskUserQuestion` is not available, ask a concise plain-text question that covers the same two decisions.

If the user gives no style direction, default to `follow article tone`.
If the user says nothing about image scope but still wants visuals, default to `cover + inline images`.

### 6b. Design prompts

**Cover:** Design 3 creative directions (per visual-prompts.md Creative A/B/C). Each includes a concept description, a full English prompt (must include `no text, no letters, no words`), and a matching color scheme.

**Inline images:** Analyze the article paragraph-by-paragraph. Image-worthy paragraphs: data/evidence, scene/narrative, turning points. Skip: pure opinion, opening hooks, CTA/closing. Maintain ≥300 characters spacing between images, 3–6 images total.

**Prompt source priority:** User-specified style > Nano Banana Pro library (via `nano-banana-pro-prompts-recommend-skill` if available) > visual-prompts.md patterns > self-designed.

- **Interactive mode:** Show all plans and wait for selection.
- **Auto mode:** After the Step 6a question is answered, select Creative A and generate all images.

### 6c. Generate images

Use `image-gen.js` for cover and inline images.

**Three-level fallback:** API generation succeeds → download predefined covers from remote CDN by color → output full prompts for manual generation and continue pipeline in text-only mode.

Insert generated image paths into the Markdown file.

## Step 7: Format + Publish

**Always publish directly to WeChat drafts. Do NOT ask the user whether to publish — this step is mandatory and automatic.**

Use `cli.js publish` with theme and color from style.yaml (or user override). For custom themes, use `--custom-theme`. Include `--cover` only if a cover image exists.

**[Fallback]:** Publish fails → generate a local HTML preview with `cli.js preview` and tell user the file path.

## Step 7.5: History + Archive

**History:** Append to `clients/{client}/history.yaml` with: date, title, topic_source, keywords, knowledge_refs, framework, word_count, media_id, theme, stats: null.

**YouMind Archive:** If `youmind.save_board` is configured, use `youmind-api.js save-article` to save the article back to the knowledge base.

**[Fallback]:** Either operation fails → warn the user, do not block the pipeline.

## Step 8: Final Output

Report the results: title (with 2 alternatives and their strategies), digest, tags, theme + color, media_id, and **result links**.

- Always include every `resultLinks` URL returned by the CLI / OpenAPI at the end.
- For draft results, also include the preview link from `articles[].url` when available.
- Always include `https://mp.weixin.qq.com/` as the manual publish / review entry.
- Render links in Markdown format, for example `[Draft preview](url)` and `[WeChat backend / draft box](https://mp.weixin.qq.com/)`.
- Phrase them as action-oriented links such as `Draft box / publish / stats` or `Published article`.

On partial success, list each step's status, include any fallback links that still help the user continue manually, and explain what needs manual completion.
