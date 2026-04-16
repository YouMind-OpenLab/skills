# Generation Playbook: Idea → 公众号-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has existing content, use `content-adaptation-playbook.md` instead.
>
> This playbook heavily references existing skill references. Read those documents at the steps indicated — they contain years of accumulated operational knowledge.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an English article to localize for 公众号 | `content-adaptation-playbook.md` (localize/transcreate mode) |
| Has a long-form piece to condense | `content-adaptation-playbook.md` (condense mode) |
| Wants to reformat existing Markdown for 公众号 | `content-adaptation-playbook.md` (cross-post mode) |
| Wants to update/republish an old article | `content-adaptation-playbook.md` (revive mode) |

If the user has only a topic, angle, or rough idea → continue with generation.

## Step 1 — Evidence brief

See `references/topic-selection.md` for hook/angle ideation methodology.

Required:
- **Thesis** (1 sentence): The core insight or argument
- **Supporting claims** (2–5 bullets): Points that build the argument
- **Evidence per claim**: Data, quotes, case studies, personal experience
- **Reader problem**: What 痛点 (pain point) does this address?
- **Desired takeaway**: What should the reader think/feel/do?
- **Voice/brand constraints**: See `clients/{client}/style.yaml` if a client context exists; else default to `writing-guide.md` §voice

If the user's topic is vague → use `references/topic-selection.md` 4-dimension model to sharpen it before proceeding.

## Step 2 — Canonical content spec

- **Title candidates** (3 options): **≤14 汉字** each for mobile list view; use 痛点/反差/数字 hooks
- **副标题** (subtitle, optional): Expand the hook if title alone is too compressed
- **Outline**: Ordered sections (hook → development → evidence → conclusion → CTA)
- **Key assets**: 封面图 (mandatory), body images (every 300–500 字), diagrams/data visuals
- **CTA**: Follow? Share? 阅读原文? Mini-program?
- **Voice markers**: Brand voice descriptors

See `references/visual-prompts.md` for image generation planning.

## Step 3 — Apply platform DNA

Read `references/platform-dna.md` (index) + the 3 core documents it cites:
- `references/writing-guide.md` — voice, structure, de-AI protocol
- `references/style-template.md` — layout blocks, formatting
- `references/wechat-constraints.md` — hard limits, safe CSS

Map the canonical spec to 公众号 norms:
- **Title**: ≤14 汉字; test: would YOU tap this in a subscription list of 20 accounts?
- **封面图**: Plan generation or selection (see `visual-prompts.md`)
- **Paragraph length**: Max 2–4 sentences per paragraph (mobile vertical scroll)
- **Small headings (小标题)**: Every 3–5 paragraphs
- **Images**: Every 300–500 字 to break text
- **Code handling**: 公众号 renders code blocks poorly — use screenshots or minimal inline code
- **External links**: Only via 阅读原文 — plan what goes there
- **底部引流**: Plan the closing card (follow guide, mini-program link, related article)

## Step 4 — Draft (公众号-native from scratch)

Read `references/writing-guide.md` §pre-writing framework **before writing**. Then:

### 公众号-native writing process:

1. **Pre-writing thinking** (per writing-guide.md): Identify unique angle, check that thesis isn't top-3 Google results
2. **Write the hook** (first 2 sentences): This is "第一屏" — if the hook fails, nothing else matters
3. **Write body**: Short paragraphs, conversational authority, 具体 over 抽象
4. **De-AI protocol**: Run full 4-level de-AI pass from writing-guide.md — zero tolerance for AI-sounding text
5. **Depth check**: Run Depth Checklist from writing-guide.md — if thesis is generic, rewrite don't polish
6. **SEO pass**: Apply rules from `references/seo-rules.md`
7. **Visual planning**: Image placement per `references/visual-prompts.md`
8. **Theme formatting**: Apply theme per `references/style-template.md`

### 公众号-native structure:

```
# [≤14 汉字 标题]

[Hook — 2 sentences, 痛点/反差/故事/数字]

[Body section 1 — short paragraphs, 小标题]

[Image break]

[Body section 2 — evidence, concrete detail]

[Image break]

[Body section 3 — pivot/insight/conclusion]

[Summary — 3-5 bullets]

[CTA — 引导关注]

[底部引流卡片]

[阅读原文 link (if applicable)]
```

### 公众号-native writing rules:
- 2–4 句 per paragraph, no exceptions on mobile
- 小标题 every 3–5 paragraphs for scanability
- Image every 300–500 字
- 具体 > 抽象: every claim grounded in concrete detail
- First-screen hook earns the scroll — treat it as the most important paragraph
- De-AI protocol mandatory: run writing-guide.md §de-AI before finalizing
- 摘要 (digest): ≤54 汉字, separate from body
- No raw code blocks longer than 5 lines — use screenshots

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Content too long (>2,500 字) | Split into 上/下篇 (part 1/2) with teaser |
| English source material | Transcreate to Chinese — not translate; idiom + example swap |
| Code-heavy content | Use screenshots or minimal inline code; link to repo via 阅读原文 |
| External link needed mid-article | Cannot — 公众号 restricts external links; use 阅读原文 at bottom |
| Images from cdn.gooo.ai | Download and upload via WeChat media API |
| Topic too generic | Sharpen with `topic-selection.md` 4-dimension model |

**Never silently truncate. Never skip the de-AI pass.**

## Step 6 — Self-critique

Before presenting to the user:

- [ ] **Platform-fit**: Does this read like a native 公众号 article? (Not a translated blog post)
- [ ] **De-AI pass**: Zero AI-sounding phrases remaining? (Run writing-guide.md §de-AI checklist)
- [ ] **Depth check**: Thesis is original, not top-3 Google results?
- [ ] **标题**: ≤14 汉字? Would YOU tap this in a subscription list?
- [ ] **封面图**: Planned or generated? Quality sufficient?
- [ ] **摘要**: ≤54 汉字 (≤120 UTF-8 bytes)?
- [ ] **段落长度**: All paragraphs ≤4 sentences?
- [ ] **小标题**: One every 3–5 paragraphs?
- [ ] **Images**: One every 300–500 字?
- [ ] **底部引流**: Follow guide / card present?
- [ ] **Client blacklist**: Checked against `style.yaml` blacklist if client context exists?
- [ ] **Word count**: 1,500–2,500 字 sweet spot?

## Step 7 — Conformance report

Output alongside the draft:

```
### 适合性报告 (Conformance Report)
- **应用的规则:** [which platform-dna + writing-guide items shaped the draft]
- **刻意偏离:** [any rule intentionally broken and why]
- **未解决的差异:** [known gaps the user should address]
- **文章统计:** [word count, image count, 段落 avg length, 标题 char count]
```
