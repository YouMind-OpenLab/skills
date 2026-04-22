# Adaptation Playbook: Existing Article → Hashnode-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to Hashnode. If the user only has an idea/topic, use `content-generation-playbook.md` instead.

## Step 0 — Intent check + sub-mode

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Cross-post** | Article from blog/Dev.to/Ghost | Hashnode post with canonical URL + series |
| **Revive** | Old Hashnode post | Updated content, refreshed |
| **Condense** | Long piece → series | Multi-post series with navigation |
| **Excerpt** | Section for promotion | Standalone deep-dive post |
| **Translate** | Article in another language | Translated technical post |
| **Localize** | Same language, different depth level | Expanded deep-dive for Hashnode audience |

If no source content → redirect to `content-generation-playbook.md`.

The **cross-post** (with canonical URL) and **localize** (expand for depth) sub-modes are most common.

## Step 1 — Source analysis

- **Origin platform**: Blog, Dev.to, Ghost, Medium, etc.
- **Core thesis** (1 sentence)
- **Claims inventory**: Distinct technical points
- **Asset inventory**: Code blocks (with language tags?), images, diagrams
- **Canonical URL**: Original URL (MUST set for cross-posts — Hashnode's strongest SEO feature)
- **Depth assessment**: Is the source ≥1,500 words? If not, expansion may be needed for Hashnode.

## Step 2 — Extract canonical content spec

- **Title candidates** (3): ~70 chars, technical depth signal
- **Subtitle candidates** (2): Context or secondary hook
- **Outline**: Technical flow
- **Key assets**: Cover image (1600×840), code (with filenames), diagrams
- **Tags**: Up to 5 from Hashnode taxonomy
- **Series**: Part of a multi-article sequence?
- **Canonical URL**: Set to original source

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md`. Assess the source:

| Dimension | Gap analysis |
|-----------|-------------|
| Depth | ≥1,500 words? If shallow, expand |
| Title | ~70 chars? Signals technical depth? |
| Subtitle | Present? |
| Cover image | 1600×840? Required for featured placement |
| Code blocks | Language tags? Filenames? |
| Benchmarks | Real metrics present? |
| Gotchas section | Real pitfalls from experience? |
| Series | Should this be part of a series? |
| Canonical URL | Set correctly for cross-posts? |
| Tags | 3–5 from Hashnode taxonomy? |

## Step 4 — Restructure

### Depth-first transformation

```
Source structure            → Hashnode structure
──────────────────────────────────────────────
Short intro                 → Problem with real numbers/scenario
Generic code examples       → Code with language + filename
No benchmarks               → Add benchmarks or at least before/after
No gotchas section          → Add real pitfalls from experience
No subtitle                 → Add context/secondary hook
(missing)                   → Cover image (1600×840)
Shallow (<1,500 words)      → EXPAND with implementation detail
(missing)                   → Series context if multi-part
Blog-casual heading style   → Technical depth headings
No table of contents        → Will auto-generate from H2/H3
```

### Code block enrichment

- Add language tags if missing
- Add filenames: ` ```ts:src/handler.ts `
- Add line highlights if applicable: ` {3-5} `
- Ensure code is complete with imports
- Split long blocks into logical steps

### Depth expansion (if source is shallow)

Hashnode audiences expect depth. If source is <1,500 words:
- Add "Why this approach" section (alternatives considered)
- Add "Implementation detail" section (expand on key code)
- Add "Results/benchmarks" section (data-driven proof)
- Add "Gotchas" section (real pitfalls)
- Add "Resources" section (repos, docs, related reading)

## Step 5 — Transcreate

- **Blog casual → technical professional**: More thorough, more evidence
- **Marketing → pure technical**: Strip all promotional language
- **Tutorial without depth → deep-dive**: Add the "why" behind each "how"
- **Cross-platform code → Hashnode-native**: Filenames in code blocks, line highlights

For translations:
- Technical terms: keep in English (industry standard)
- Rebuild structure for Hashnode audience (not literal translation)

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source too shallow (<800 words) | Expand with real examples, benchmarks, gotchas — or reconsider if Hashnode is right |
| Source too long (>4,000 words) | Split into series with linked navigation |
| No code in source | Add minimal working examples; if conceptual, consider Ghost/WordPress |
| No canonical URL for cross-post | Always set — SEO penalty for duplicate content |
| Cover image missing | Generate or source (required for featured feeds) |
| Source is marketing-heavy | Strip to pure technical; if nothing remains, wrong platform |

## Step 7 — Self-critique

- [ ] **Platform-fit**: Reads like a Hashnode deep-dive?
- [ ] **Depth**: ≥1,500 words with substance?
- [ ] **Title**: ~70 chars, signals depth?
- [ ] **Subtitle**: Present and useful?
- [ ] **Cover image**: 1600×840?
- [ ] **Code blocks**: Language + filename on all?
- [ ] **Real metrics**: Benchmarks or data present?
- [ ] **Gotchas**: Real pitfalls from experience?
- [ ] **Tags**: 3–5 from taxonomy?
- [ ] **Canonical URL**: Set correctly?
- [ ] **Series**: Position set if multi-part?
- [ ] **Thesis fidelity**: Core preserved?

## Step 8 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [list]
- **Deliberate deviations:** [rules broken and why]
- **Unresolved mismatches:** [gaps]
- **Adaptation stats:** [source words → Hashnode words, code blocks enriched, depth expanded?]
- **Hashnode fields:** [title, subtitle, cover, canonical, series, tags]
- **Fidelity:** [thesis preserved ✓/✗]
```
