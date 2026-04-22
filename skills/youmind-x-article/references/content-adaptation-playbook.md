# Adaptation Playbook: Existing Article → X-Native

> Use when the user has an existing draft, published article, or content from another platform to bring to X. If the user only has an idea/topic, use `content-generation-playbook.md` instead.
>
> **Thread decomposition** is this playbook's core competency. Breaking long-form content into an X-native thread is the primary use case.

## Step 0 — Intent check + sub-mode

Identify the sub-mode before proceeding:

| Sub-mode | Input | Output |
|----------|-------|--------|
| **Condense** | Long article (>1,000 words) | Thread of 5–15 tweets |
| **Cross-post** | Short blog post (<1,000 words) | Thread + link back to canonical |
| **Excerpt** | One section of a longer piece | Teaser thread (3–5 tweets) + link to full |
| **Translate** | Article in another language | Same-structure thread in target language |
| **Revive** | Old thread or article | New thread with updated info |
| **Localize** | Same-language but different audience | Tone/example swap for X's audience |

If no source content exists → redirect to `content-generation-playbook.md`.

The **condense** sub-mode is the most common and most valuable — the rest of this playbook optimizes for it.

## Step 1 — Source analysis

- **Origin platform**: Where was this published? (blog, Ghost, Dev.to, Qiita, WeChat, etc.)
- **Core thesis** (1 sentence): Extract the single central claim or insight
- **Claims inventory** (bullets): List every distinct claim/point in the source
- **Asset inventory**: Images, code blocks, diagrams, links, data tables
- **Canonical URL**: The original publication URL (for link-back in final tweet)
- **Word count**: Determines thread length strategy

## Step 2 — Extract canonical content spec

Same schema as `content-generation-playbook.md` Step 2:
- **Title/hook candidates** (3): Distilled from the source thesis
- **Outline**: Ordered claims, now assessed for thread viability
- **Key assets**: Which images/data can fit X's media constraints?
- **CTA**: Link back to canonical source
- **Voice markers**: Should the thread match source voice or shift to X voice?

## Step 3 — Gap analysis vs platform DNA

Read `references/platform-dna.md`. Assess the source against X's constraints:

| Dimension | Gap analysis question |
|-----------|----------------------|
| Length | Source is >280 chars? → Thread needed. How many atomic claims? |
| Hook | Does the source have a strong opening, or does it need a new hook for X? |
| Self-containment | Can each claim stand alone as a single tweet? |
| Media | Are there usable images, or do we need to create/drop them? |
| Code | Are there code blocks? (Must become screenshots or be dropped) |
| Links | Where does the canonical link go? (Last tweet only) |
| Tone | Is the source tone X-native, or does it need register shift? |
| Math/formulas | Any LaTeX? (Must render as images) |

## Step 4 — Restructure: Thread Decomposition

This is the core transformation. Follow these rules precisely.

### Thread decomposition algorithm

**4.1 — Thesis extraction**
Distill the source to a single sentence. This becomes the **candidate hook tweet**.

**4.2 — Atomic claim identification**
Go through the source and extract 5–15 **atomic claims** — points that:
- Support the thesis
- Each stand alone (readable without the others)
- Each fit approximately within 280 characters
- Each are valuable if retweeted individually

**4.3 — Claim fitness check**
For each atomic claim: can it fit in 280 chars (including any image reference)?
- **Yes** → becomes one tweet
- **Barely (250–280 chars)** → tighten the language
- **No (>280 chars)** → split into two consecutive tweets OR drop the claim
- Not every source claim must survive — prioritize the strongest

**4.4 — Hook tweet construction**
The hook tweet is the most important tweet. Rules:
- State the thesis / promise / curiosity gap **directly**
- NO "here's a thread about X" — show, don't announce
- If there's a killer stat or example, lead with it
- Test: would someone who sees ONLY this tweet find it worth reading?

Hook templates (choose the best fit):
```
[Contrarian take]: "Everyone says X. Wrong. Here's what actually works:"
[Stat lead]: "90% of [audience] do X. But the top 1% do Y instead:"
[Story lead]: "3 years ago I [painful thing]. Today I [success]. Here's the path:"
[Checklist]: "How to [achieve X] in [N] steps:"
[Curiosity]: "The most underrated [thing] is [thing]. Most people miss this:"
```

**4.5 — Body tweet rules**
- Each tweet = one claim, self-contained
- No "as I said above" — reader may land mid-thread via RT
- Line breaks improve readability; use them
- Emoji: sparingly, for visual scanning (1–2 per tweet max)
- Data/numbers in tweets earn higher engagement
- Plain text only — no markdown (X doesn't render it)
- Code: screenshots only (no syntax highlighting on X)

**4.6 — Final tweet rules**
- TL;DR of the thread (1 sentence)
- Link to canonical source (blog post, article URL)
- Optional CTA: "If you liked this, follow + RT the first tweet"
- No image in final tweet (let the link preview breathe)

**4.7 — Media placement strategy**
- Hook tweet: image/chart if it reinforces the stat or claim
- Body tweets: images only when genuinely illuminating (screenshots, diagrams)
- No images just for decoration — X users scroll past stock visuals
- Max 4 images per tweet; 1 per tweet is typical in threads

### Thread length guidelines

| Source length | Recommended thread length |
|--------------|--------------------------|
| 500–1,000 words | 3–5 tweets |
| 1,000–2,000 words | 5–10 tweets |
| 2,000–3,000 words | 8–15 tweets |
| 3,000+ words | 12–15 tweets (cap) or split into 2 threads |

## Step 5 — Transcreate

If the source and X thread are in the same language, transcreation is lighter but still applies:
- **Register shift**: Academic/formal → conversational; blog → punchy
- **Example localization**: Niche/domain examples → broader-appeal examples
- **Jargon reduction**: Technical terms may need simplification for X's broader audience
- **Hook rewrite**: Source article's opening rarely works as a tweet hook — rewrite from scratch

If translating across languages:
- Don't literally translate — rebuild the thread natively in the target language
- Hook must work in the target language's X culture
- Examples and references should be relevant to the target audience

## Step 6 — Constraint conflict resolution

| Conflict | Resolution |
|----------|-----------|
| Source thesis too complex for thread (>15 claims) | Option 1: Premium Long Post instead. Option 2: Two separate threads. Option 3: Thread = summary + link to canonical |
| Source has extended code samples | Screenshot key code; link to Gist/repo in final tweet |
| Source requires LaTeX/math | Render formulas as images |
| Source requires interactive elements | X Poll for single-question engagement; else link out |
| Source images from cdn.gooo.ai | CDN URLs are allowlisted for X posts via YouMind API |
| Too many claims to fit 15 tweets | Prioritize strongest 10; mention "full version" with link |

**Never silently drop the thesis. If condensing loses the core argument, flag to the user and suggest an alternate platform.**

## Step 7 — Self-critique

- [ ] **Platform-fit**: Does this thread look native to X? (Not a blog post chopped into 280-char chunks)
- [ ] **Hook earns the scroll**: Read tweet 1 as a stranger — would you keep reading?
- [ ] **Self-contained test**: Pick any body tweet — does it make sense alone?
- [ ] **280-char compliance**: Every tweet within limit?
- [ ] **Thesis fidelity**: Core argument preserved from source?
- [ ] **Attribution**: Canonical URL in final tweet? Source credited?
- [ ] **Link placement**: External links in last tweet only?
- [ ] **No mid-thread fluff**: Every tweet adds value?
- [ ] **Media discipline**: Images only where they add genuine value?
- [ ] **Thread length**: 5–15 tweets? Flagged if >15?
- [ ] **Voice match**: Thread voice matches intended brand/author?

## Step 8 — Conformance report

```
### Conformance Report
- **Platform DNA rules applied:** [list]
- **Deliberate deviations:** [any rule broken and why]
- **Unresolved mismatches:** [gaps the user should know]
- **Adaptation stats:** [source word count → tweet count, compression ratio, claims kept/dropped]
- **Thread structure:** [hook type, body tweet count, media count, link placement]
- **Fidelity:** [thesis preserved ✓/✗, key claims preserved N/M]
```
