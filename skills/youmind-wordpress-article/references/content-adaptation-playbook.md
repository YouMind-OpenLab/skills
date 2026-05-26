# Adaptation Playbook: Existing Article → WordPress-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to WordPress. If the user only has an idea/topic, use `content-generation-playbook.md` instead.

## Step 0 — Intent check + sub-mode

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Cross-post** | Article from Dev.to/Ghost/Medium | WordPress-native post with SEO optimization |
| **Revive** | Old WordPress post | Updated content + refreshed publish date (SEO freshness) |
| **Condense** | Long piece | Teaser post + internal link to full content |
| **Translate** | Article in another language | Translated post with localized SEO |
| **Localize** | Same language, different platform voice | SEO-optimized WordPress version |
| **Excerpt** | Section from larger work | Supporting post linked from pillar |

If no source content → redirect to `content-generation-playbook.md`.

The **revive** sub-mode is uniquely powerful on WordPress — updating old posts and refreshing the publish date is a major SEO strategy.

## Step 1 — Source analysis

- **Origin platform**: Dev.to, Ghost, Medium, Hashnode, blog, etc.
- **Core thesis** (1 sentence)
- **Claims inventory**: Distinct points/sections
- **Asset inventory**: Images (with alt text status), code blocks, diagrams, links
- **Canonical URL**: Original URL (set canonical if cross-posting)
- **SEO status**: Does the source have focus keyphrase, meta description, heading hierarchy?

## Step 2 — Extract canonical content spec

- **Title candidates** (3): ≤60 chars, keyphrase front-loaded
- **Focus keyphrase** (1): 2–4 words target search term
- **Slug**: lowercase-hyphenated keyphrase
- **Meta description** (2 options): ≤155 chars, keyphrase included
- **Outline**: H2 sections mapped to sub-keyphrases
- **Key assets**: Featured image (1200×630), inline images with planned alt text
- **Internal link targets**: 2–5 related posts on the site
- **Outbound link targets**: ≥1 authority source
- **Categories**: 1–2 from site hierarchy
- **Tags**: 5–10 relevant
- **Schema**: Article / HowTo / FAQ

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md`. Assess the source against WordPress + SEO norms:

| Dimension | Gap analysis |
|-----------|-------------|
| Focus keyphrase | Identified? In title, first paragraph, H2, slug, meta? |
| Meta description | Exists? ≤155 chars with keyphrase? |
| Title | ≤60 chars? Keyphrase front-loaded? |
| Heading hierarchy | H1 once (title)? H2/H3 properly nested? |
| Alt text | Every image has descriptive alt? Keyphrase in ≥1? |
| Internal links | ≥2 to related posts? |
| Outbound links | ≥1 DoFollow to authority? |
| Readability | Short paragraphs? Transition words? Passive voice ≤10%? |
| Featured image | 1200×630? With alt text? |
| Categories vs tags | Properly distinguished? |

## Step 4 — Restructure

### SEO-first transformation

```
Source structure            → WordPress structure
──────────────────────────────────────────────
Title (any length)          → ≤60 chars, keyphrase front-loaded
(missing)                   → Focus keyphrase identification
(missing)                   → Meta description (≤155 chars)
(missing)                   → Slug (lowercase-hyphenated keyphrase)
H1 in body                 → Remove (WP title = H1)
Any heading structure       → H2 for sections, H3 for subsections only
(missing)                   → Featured image (1200×630 with alt text)
No alt text on images       → Add descriptive alt text (keyphrase in ≥1)
No internal links           → Add 2-5 links to related posts
No outbound links           → Add ≥1 DoFollow to authority source
(missing)                   → Categories (1-2 hierarchical)
(missing)                   → Tags (5-10 flat)
Long paragraphs             → Short (2-4 sentences, transition words)
Markdown                    → Gutenberg blocks or clean HTML
No schema                   → Article/HowTo/FAQ structured data
```

### Gutenberg block mapping

If the source is Markdown, decide:
- **Keep as HTML body** (simpler, YouMind pipeline default)
- **Map to Gutenberg blocks** (richer, if site uses block editor features)

Common Markdown → Gutenberg mappings:
- Code fence → Code block (with language)
- Blockquote → Quote or Pullquote block
- Image → Image block (with alt, caption)
- Table → Table block
- Horizontal rule → Separator block

### SEO optimization pass

Run the SEO plugin rubric from `platform-dna.md`:
1. Keyphrase in title, first paragraph, ≥1 H2, slug, meta description
2. Keyphrase density 0.5–2.5%
3. Alt text on every image (keyphrase in ≥1)
4. ≥2 internal links, ≥1 outbound authority link
5. Short paragraphs, transition words, passive voice ≤10%
6. No duplicate H2 text
7. No multiple H1

## Step 5 — Transcreate

If translating or shifting register:
- **SEO in target language**: Focus keyphrase must be in the target language's search terms
- **Meta description**: Rewrite in target language (don't translate literally)
- **Slug**: Target-language keyphrase, lowercase-hyphenated
- **Examples**: Localize to target audience where domain-specific
- **Voice**: Match site's brand voice (check existing posts for tone)

For same-language cross-post:
- Register shift to match site voice
- Add SEO elements missing from source (keyphrase, meta, internal links)
- Featured image + alt text + excerpt if missing

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source has no focus keyphrase | Research and identify before proceeding (no keyphrase = invisible) |
| Source is too long (>3,000 words) | Pillar post OK; or split into pillar + supporting posts |
| Source has no internal link targets | Publish anyway; plan companion posts to link later |
| Source keyphrase already used | Long-tail variant or different angle |
| Source images lack alt text | Write descriptive alt text for every image |
| Source from different CMS | Map formatting to Gutenberg blocks or clean HTML |
| Featured image missing | Generate or source before publishing |
| Source is thin for target keyphrase | Expand with examples, case studies, FAQ — never publish thin |

## Step 7 — Self-critique

Run SEO plugin rubric as checklist:
- [ ] **Focus keyphrase**: In title, first paragraph, URL, ≥1 H2, meta description?
- [ ] **Meta description**: ≤155 chars, keyphrase, complete thought?
- [ ] **Outbound links**: ≥1 DoFollow to authority?
- [ ] **Internal links**: ≥2 to related posts?
- [ ] **Alt text**: Every image, keyphrase in ≥1?
- [ ] **Heading hierarchy**: H1 once; H2/H3 nested?
- [ ] **Readability**: Short paragraphs, transition words, passive ≤10%?
- [ ] **Keyphrase density**: 0.5–2.5%?
- [ ] **Featured image**: 1200×630, alt text?
- [ ] **Categories**: 1–2 correct?
- [ ] **Tags**: 5–10 relevant?
- [ ] **Slug**: Keyphrase, lowercase-hyphenated?
- [ ] **Schema**: Appropriate type?
- [ ] **Thesis fidelity**: Core argument preserved?
- [ ] **Canonical URL**: Set if cross-post?

## Step 8 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [SEO/WordPress items used]
- **Deliberate deviations:** [rules broken and why]
- **Unresolved mismatches:** [gaps — e.g., no internal link targets yet]
- **SEO stats:** [keyphrase, density, internal links, outbound links, Flesch estimate]
- **WordPress fields:** [slug, categories, tags, featured image, schema, meta description]
- **Fidelity:** [thesis preserved ✓/✗]
```
