# Adaptation Playbook: Existing Article → 公众号-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to 公众号. If the user only has an idea/topic, use `content-generation-playbook.md` instead.
>
> This playbook heavily references existing skill references. Read those documents at the steps indicated.

## Step 0 — Intent check + sub-mode

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Localize** | English article → Chinese 公众号 | Transcreated article in 公众号 voice |
| **Cross-post** | Markdown from blog/other platform | 公众号-formatted rich-text article |
| **Condense** | Western long-form (>3,000 words) | 公众号 article ≤2,500 字 |
| **Revive** | Old 公众号 article | Updated content + 二次推送 |
| **Excerpt** | Section from larger work | Teaser article + 阅读原文 to full |
| **Translate** | Japanese/other language article | Full transcreation to Chinese |

If no source content exists → redirect to `content-generation-playbook.md`.

The **localize** (English → Chinese) and **condense** sub-modes are the most common for 公众号.

## Step 1 — Source analysis

- **Origin platform**: Blog, Dev.to, Ghost, Hashnode, Medium, etc.
- **Core thesis** (1 sentence): What is the central argument or insight?
- **Claims inventory**: Distinct points in the source
- **Asset inventory**: Images (check URLs for cdn.gooo.ai!), code blocks, diagrams, links
- **Canonical URL**: Original publication URL (will go in 阅读原文)
- **Language**: Source language
- **Word count**: Determines if condensation is needed (target: 1,500–2,500 字)

## Step 2 — Extract canonical content spec

- **Title candidates** (3): mobile-first titles with subject + payoff in the first half; prefer clarity over ornament
- **摘要** (digest): ≤54 汉字 (≤120 UTF-8 bytes)
- **Outline**: Sections mapped to 公众号 flow
- **Key assets**: 封面图 (mandatory), body images, diagrams
- **CTA**: Follow? Share? 阅读原文 to canonical?
- **Voice markers**: See `clients/{client}/style.yaml` if available

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md` (index) + cited core references. Assess the source:

| Dimension | Gap analysis question |
|-----------|----------------------|
| Language | Chinese? If not, full transcreation needed |
| Paragraph length | All ≤4 sentences? (Mobile vertical scroll) |
| Title quality | Does the title front-load subject + payoff clearly? |
| 封面图 | Present? Quality sufficient? |
| Code blocks | 公众号 renders code poorly — need screenshots? |
| External links | 公众号 restricts these — plan 阅读原文 |
| Images | cdn.gooo.ai URLs? Re-host via WeChat media API |
| Tone | Matches 公众号 conversational authority? |
| Western examples | Need localization to domestic equivalents? |
| Length | ≤2,500 字? If longer, need condensation |

## Step 4 — Restructure

Re-skeleton the content for 公众号's mobile-first reading experience.

See `references/writing-guide.md` and `references/style-template.md` for formatting details.

### Structure transformation

```
Source structure            → 公众号 structure
──────────────────────────────────────────────
Long introduction           → Hook in 2 sentences (第一屏即钩)
Long paragraphs             → Break to 2-4 句 per paragraph
No subheadings              → Add 小标题 every 3-5 paragraphs
Sparse images               → Add only where they improve comprehension, rhythm, or trust
Code blocks (>5 lines)      → Screenshots or minimal inline code
Numbered lists              → Simplified, shorter items
External links mid-text     → Move to 阅读原文 at bottom
Academic/formal tone         → Conversational authority
No CTA                      → Add 引导关注 + 底部引流卡片
No cover image              → Generate 封面图 (mandatory)
```

### Image handling
- **cdn.gooo.ai images**: Download → upload via WeChat media API → swap URLs
- **External images**: Download → upload to WeChat media → replace
- **Image frequency**: Use images intentionally; do not add them by quota alone
- See `references/visual-prompts.md` for cover image generation

### Code handling
- 公众号 code rendering is poor — blocks often lose formatting
- **≤5 lines**: Keep as inline code with monospace styling
- **>5 lines**: Convert to screenshot or link to external repo via 阅读原文
- **If code is the main content**: Consider whether 公众号 is the right platform

## Step 5 — Transcreate

English → Chinese transcreation is NOT translation. It's rebuilding the article natively.

### Register shift
- Target: conversational authority — 口语化 but informed
- Not academic: avoid 「其」「此」「故而」formal written Chinese
- Not slangy: avoid excessive 「梗」that age poorly
- Natural flow: read aloud test — if it sounds stiff, rewrite

### Example localization
- Western products/services → domestic equivalents where context matters
  - "Slack" → context-dependent (keep if dev audience; "企业微信" if business)
  - "$100/month" → "约 700 元/月" (or ≈ ¥700)
  - Stack Overflow → 掘金 / V2EX / 知乎 where the comparison is about community
- Keep global tech products as-is when the audience knows them (GitHub, AWS, React)

### Idiom replacement
- "out of the box" → "开箱即用"
- "under the hood" → "底层原理"
- "game changer" → "改变玩法" or avoid (sounds marketing)
- "boilerplate" → "模板代码"
- "gotcha" → "踩坑" / "坑点"

### Title transcreation
- Don't translate — rebuild for 公众号 subscription list
- Apply 痛点/反差/数字 or clear payoff hook
- Put the subject and value in the first half of the title
- Example: "Building REST APIs with Hono" → "用 Hono 写 API，比 Express 快 10 倍"

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source >2,500 字 in Chinese | Split into 上/下篇 (part 1/2) with teaser link |
| Source code-heavy | Screenshots for key code; link to repo via 阅读原文 |
| Source needs external links | All external links → 阅读原文 (only allowed placement) |
| English source for Chinese audience | Full transcreation per Step 5 |
| Images from cdn.gooo.ai | Download + re-upload via WeChat media API |
| Formal/academic source | Register shift to conversational authority |
| No cover image available | Generate via skill's image provider chain |
| Topic violates client blacklist | Check `style.yaml` blacklist; refuse or redirect |

**Never skip the de-AI pass.** See `references/writing-guide.md` §de-AI protocol.

## Step 7 — Self-critique

- [ ] **Platform-fit**: Reads like a native 公众号 article? (Not a translated blog post)
- [ ] **De-AI pass**: Zero AI-sounding phrases? (Run writing-guide.md §de-AI checklist)
- [ ] **标题**: Mobile-first and compelling in subscription list?
- [ ] **摘要**: ≤54 汉字 (≤120 UTF-8 bytes)?
- [ ] **封面图**: Present and quality?
- [ ] **段落长度**: All ≤4 sentences?
- [ ] **小标题**: Every 3–5 paragraphs?
- [ ] **Images**: Used intentionally and zero external hotlink failures?
- [ ] **Code**: Minimized; screenshots for long blocks?
- [ ] **底部引流**: Present?
- [ ] **外部链接**: All in 阅读原文 only?
- [ ] **Thesis fidelity**: Core argument preserved from source?
- [ ] **Attribution**: 阅读原文 links to canonical URL?
- [ ] **Client blacklist**: Scanned if client context exists?
- [ ] **Transcreation quality**: Reads naturally in Chinese? (Not 翻译腔?)
- [ ] **Word count**: 1,500–2,500 字?

## Step 8 — Conformance report

```
### 适合性报告 (Conformance Report)
- **应用的规则:** [platform-dna + writing-guide items used]
- **刻意偏离:** [rules broken and why]
- **未解决的差异:** [gaps]
- **变换统计:** [source lang, source word count → 公众号 word count, images re-hosted]
- **忠实性:** [thesis preserved ✓/✗, claims preserved N/M]
```
