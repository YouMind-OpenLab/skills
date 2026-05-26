# Generation Playbook: Idea → WordPress-Native Draft

> Use when the user has a topic, thesis, or angle but **no existing draft**. If the user has existing content, use `content-adaptation-playbook.md` instead.

## Step 0 — Intent check

| User intent | Redirect to |
|-------------|------------|
| Has an existing article to publish on WordPress | `content-adaptation-playbook.md` (cross-post mode) |
| Wants to update an old WordPress post | `content-adaptation-playbook.md` (revive mode) |
| Wants to condense content into a teaser | `content-adaptation-playbook.md` (condense mode) |
| Wants to translate content | `content-adaptation-playbook.md` (translate mode) |

If the user has only a topic or thesis → continue with generation.

## Step 1 — Evidence brief

WordPress content lives or dies by SEO. Thin content gets penalized by Google's Helpful Content Update. Evidence-backed content ranks.

Required:
- **Thesis** (1 sentence): The primary keyphrase and what the article delivers
- **Focus keyphrase** (2–4 words): The target search term (e.g., "TypeScript generics tutorial")
- **Supporting claims** (2–5 bullets): Sub-topics and sections
- **Evidence per claim**: Code, benchmarks, case studies, expert sources
- **Reader problem**: What search intent does this serve? (informational/transactional/navigational)
- **Desired takeaway**: Reader can DO something specific after reading
- **Voice/brand constraints**: Site brand voice, target audience expertise level

If focus keyphrase is missing → stop and determine it first. No keyphrase = no SEO strategy = invisible content.

## Step 2 — Canonical content spec

- **Title candidates** (3 options): ≤60 chars each, focus keyphrase front-loaded
- **Slug**: lowercase-hyphenated version of keyphrase
- **Meta description candidates** (2 options): ≤155 chars, contains keyphrase, complete sentence
- **Outline**: H2 sections mapped to sub-keyphrases
- **Key assets**: Featured image (1200×630), inline images (with alt text planned), diagrams
- **Internal link targets**: 2–5 related posts on the same site
- **Outbound link targets**: ≥1 authority source
- **CTA**: Subscribe, download, read related, comment
- **Categories**: 1–2 from site's hierarchy
- **Tags**: 5–10 relevant
- **Schema type**: Article? HowTo? FAQ?

## Step 3 — Apply platform DNA

Read `references/platform-dna.md`. Map the canonical spec to WordPress + SEO norms:

- **Title**: ≤60 chars; keyphrase in first half; test: would you click this in Google results?
- **Slug**: Matches keyphrase; lowercase-hyphenated; short
- **Meta description**: ≤155 chars; keyphrase included; complete thought; preview of value
- **First paragraph**: Must contain focus keyphrase (Yoast/RankMath requirement)
- **Heading hierarchy**: H1 = title only; H2 for major sections; H3 for subsections; keyphrase in ≥1 H2
- **Keyphrase density**: Target 0.5–2.5% across the body
- **Featured image**: 1200×630; alt text includes keyphrase
- **Internal links**: Plan ≥2 links to related posts
- **Outbound links**: Plan ≥1 DoFollow to authority source
- **Categories vs tags**: Categories = structural navigation; tags = content grouping
- **Readability**: Flesch target, short paragraphs, transition words, passive voice ≤10%

## Step 4 — Draft (WordPress-native from scratch)

Write SEO-optimized content that serves the reader, not just the search engine.

### WordPress-native article structure:

```markdown
# [≤60 char title — keyphrase front-loaded]

[First paragraph: problem statement + focus keyphrase]
[Reader should know within 2 sentences: what problem this solves and who it's for]

## [H2: First major section — sub-keyphrase]

[Short paragraphs, scannable]
[Code blocks with language tags if applicable]
[Internal link to related post]

![Descriptive alt text with keyphrase](image-url)

## [H2: Second major section]

[Evidence-backed content]
[Outbound link to authority source]

### [H3: Subsection if needed]

[Deeper detail]

## [H2: Third major section]

[Practical application, working examples]

## Conclusion

[Summary of key points]
[CTA: subscribe, comment, read related]

---
Categories: [1-2]
Tags: [5-10]
Featured image: [1200×630 with alt text]
Schema: [Article/HowTo/FAQ]
```

### WordPress-native writing rules:
- **H1 once only** (= post title); H2 for sections; H3 for subsections
- **Keyphrase in**: title, first paragraph, ≥1 H2, slug, meta description, ≥1 image alt text
- **Short paragraphs**: 2–4 sentences for readability (Flesch score target)
- **Transition words**: Use them between paragraphs (Yoast/RankMath checks this)
- **Passive voice**: ≤10% of sentences
- **Internal links**: Weave 2–5 naturally into the body
- **Outbound links**: ≥1 DoFollow to authority (E-E-A-T signal)
- **Alt text**: Every image, descriptive, keyphrase in at least one
- **Code blocks**: Language tags always present
- **No keyword stuffing**: Natural language; 0.5–2.5% density
- **Categories ≠ tags**: Don't use them interchangeably

## Step 5 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Content too long (>3,000 words) | Split into pillar + supporting posts with internal links |
| No existing internal link targets | Create the post anyway; plan companion posts |
| Focus keyphrase already used by another post | Differentiate angle or choose long-tail variant |
| Code-heavy content | Use Gutenberg code block; keep individual blocks <40 lines |
| Content thin for target keyphrase | Expand with examples, case studies, FAQs — don't publish thin |
| Featured image missing | Generate or source before publishing (bare cards look amateur) |

**Never publish thin content targeting a competitive keyphrase. Never skip meta description.**

## Step 6 — Self-critique

Run the SEO plugin rubric from `platform-dna.md` as a checklist:

- [ ] **Focus keyphrase**: In title, first paragraph, URL, ≥1 H2, meta description?
- [ ] **Meta description**: ≤155 chars, contains keyphrase, complete thought?
- [ ] **Outbound links**: ≥1 DoFollow to authority?
- [ ] **Internal links**: ≥2 to related posts?
- [ ] **Alt text**: On every image, keyphrase in ≥1?
- [ ] **Heading hierarchy**: H1 once; H2/H3 properly nested?
- [ ] **Readability**: Short paragraphs, transition words, passive voice ≤10%?
- [ ] **Keyphrase density**: 0.5–2.5%?
- [ ] **Featured image**: 1200×630, relevant, alt text present?
- [ ] **Categories**: 1–2 assigned correctly (not tags)?
- [ ] **Tags**: 5–10 relevant tags?
- [ ] **Slug**: Matches keyphrase, lowercase-hyphenated?
- [ ] **Schema**: Article/HowTo/FAQ appropriate for content type?
- [ ] **E-E-A-T**: Content demonstrates genuine experience and expertise?
- [ ] **No thin content**: Substantial enough for target keyphrase competition?

## Step 7 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [which SEO/WordPress items shaped the draft]
- **Deliberate deviations:** [any rule intentionally broken and why]
- **Unresolved mismatches:** [known gaps — e.g., no internal link targets exist yet]
- **SEO stats:** [word count, keyphrase density, internal/outbound link count, Flesch estimate]
- **WordPress fields:** [slug, categories, tags, featured image status, schema type]
```
