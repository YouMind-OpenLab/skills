# WeChat Custom Theme Design Language

> This is not a CSS property checklist. This is a design thinking protocol powered by [Impeccable](https://impeccable.style/) design skills.
>
> When generating a theme, the AI **must** complete design thinking (Part 1) before translating decisions into CSS (Part 2).
> Skipping design thinking and jumping straight to CSS = garbage theme.
>
> **Every design phase below mandates specific Impeccable skills.** These skills embed professional design vocabulary and methodology — use them, don't bypass them.

---

## Prerequisite: Install Impeccable

This DSL is built on top of [Impeccable](https://impeccable.style/) — a professional design skill suite that gives AI agents real design vocabulary and methodology. Without it, theme creation degrades to guesswork.

**Install via Claude Code:**

```bash
claude install-skill https://impeccable.style
```

After installation, run `/teach-impeccable` once in the project root. This generates an `.impeccable.md` file that captures your project's design context (brand, audience, aesthetic direction). All subsequent Impeccable skills (`/typeset`, `/colorize`, `/critique`, `/audit`, `/arrange`, `/polish`, `/distill`, `/bolder`, `/quieter`) will read from this file automatically — ensuring every theme you create is grounded in consistent, project-aware design decisions rather than generic defaults.

**Why this matters:** Most AI-generated themes fail not because of bad CSS, but because of absent design intent. Impeccable's 20+ skills embed the vocabulary and judgment of a professional designer — typography scales, color strategy, visual rhythm, hierarchy theory, cognitive load assessment, accessibility auditing. This DSL is the orchestration layer that tells those skills *when* and *how* to fire during theme creation. One without the other is incomplete.

**Skills used in this DSL:**

| Skill | Role in Theme Creation |
| --- | --- |
| `/teach-impeccable` | One-time setup — captures project design context |
| `/critique` | Persona testing, emotional validation, heuristic scoring |
| `/typeset` | Font selection, type scale derivation, hierarchy validation |
| `/bolder` | Amplify timid designs that feel generic or safe |
| `/quieter` | Dial back aggressive designs that feel overwhelming |
| `/arrange` | Vertical rhythm, spacing systems, layout validation |
| `/distill` | Strip unnecessary decoration, justify every element |
| `/colorize` | Strategic color selection, contrast validation |
| `/audit` | P0–P3 technical quality scoring across accessibility, consistency, clarity |
| `/polish` | Final micro-detail pass before output |

---

## Part 1: Design Thinking (Must Complete First)

### Phase 1 — Emotional Positioning

Every theme starts with an emotion. Not "blue." Not "left-aligned." The question is:

**What should this article _feel_ like to read?**

| Emotional Direction | Design Language Traits | What It's NOT |
|---|---|---|
| Solemn & Dignified | Serif, centered, wide letter-spacing, thin double-rule frames, generous whitespace | Not "empty" — it's ceremonial gravity |
| Tech & Futuristic | Sans-serif, sharp edges, dark code blocks, glowing borders, tight rhythm | Not "just add rgba" — it's information density |
| Literary & Warm | Serif, first-line indent, warm gray palette, rounded quote cards, relaxed line-height | Not "just add border-radius" — it's the texture of paper |
| Business & Professional | Sans-serif, left-aligned, bold-bordered headings, table emphasis, compact spacing | Not "boring" — it's trust and authority |
| Playful & Energetic | Large title fonts, color-block backgrounds, rounded cards, tight paragraph spacing | Not "flashy" — it's rhythm and energy |

**Write a one-sentence emotional positioning before continuing.**

#### Required Skill: `/critique`

Run `/critique` mentally against the emotional positioning. Ask:
- Does this emotion match the article's content and audience?
- Test against **persona archetypes**: would a first-time reader, a domain expert, and a casual scanner all receive the intended emotional signal?
- Assess **cognitive load**: does the emotional direction risk overwhelming or underwhelming the reader?

---

### Phase 2 — Visual Personality

Define the theme's "character" — if this layout were a person, what would they be like?

Answer three questions:

**Volume** — Is this theme whispering or giving a keynote?
- Whisper: font-weight 500–600, no background colors on headings, semi-transparent decorations
- Normal: font-weight 600–700, moderate decoration, clear but not attention-grabbing
- Keynote: font-weight 700–800, color-block heading backgrounds, high contrast

**Temperature** — Warm or cool palette?
- Cool: slate gray, indigo, blue-gray → rational, distant, contemplative
- Neutral: pure grays, minimal color → restrained, professional
- Warm: ochre, amber, warm brown → intimate, narrative, humanistic

**Density** — How tightly packed are elements?
- Spacious: paragraph spacing 24–28px, line-height 1.8–2.0, generous whitespace → settling, reading-focused
- Balanced: paragraph spacing 18–22px, line-height 1.7–1.8 → equilibrium
- Compact: paragraph spacing 12–16px, line-height 1.6–1.7 → information-dense, efficient

#### Required Skills: `/typeset` + `/bolder` or `/quieter`

- **`/typeset`**: Use to validate font choices against the volume and temperature decisions. Typeset enforces **fixed type scales** — don't invent arbitrary font sizes. Let the skill recommend a coherent scale (e.g., Major Third 1.25, Perfect Fourth 1.333) that produces the right hierarchy for the chosen volume level.
- **`/bolder`**: If the initial personality feels too safe, bland, or generic — use `/bolder` to amplify visual impact while maintaining usability. Push past the "default AI aesthetic."
- **`/quieter`**: If the personality feels too aggressive, garish, or overstimulating — use `/quieter` to dial back intensity while preserving design quality. Reduce without making it lifeless.

**Calibration loop**: After defining visual personality, run `/bolder` or `/quieter` as needed until the personality feels intentional, not accidental. A theme should feel _designed_, not _defaulted_.

---

### Phase 3 — Hierarchy Strategy

Headings are not just "big text." They are the article's skeleton — the navigation readers use when scanning.

**Methods for establishing hierarchy** (combine multiple):

| Method | Effect | Example |
|---|---|---|
| Size difference | Most direct hierarchy signal | H1 24px → H2 20px → H3 18px |
| Weight variation | Creates light/heavy contrast at same size | H1 700 → H3 600 → H5 500 |
| Color depth | Higher levels = deeper color | H1 #3a3a3a → H3 #5a6374 |
| Decoration decay | Decoration decreases with level | H1 double-rule → H2 short underline → H3 none |
| Alignment shift | High levels centered, low levels left | H1–H2 centered → H3+ left-aligned |
| Spacing rhythm | Higher levels = more top margin | H1 margin-top 48px → H3 32px |

**Core principle: Never use just one method.** The best hierarchy layers multiple signals into a cohesive whole.

#### Required Skills: `/typeset` + `/arrange`

- **`/typeset`**: Derive heading sizes from a **type scale**, not arbitrary numbers. The type scale must produce clear visual separation between levels while maintaining harmonic relationships. Validate that font weight, size, and color work together — don't just crank up font-size and call it hierarchy.
- **`/arrange`**: Validate **vertical rhythm** and spacing between hierarchy levels. The spacing between headings and body text is not arbitrary — it signals structural relationships. `/arrange` catches monotonous grids, inconsistent spacing, and weak visual hierarchy.

---

### Phase 4 — Rhythm Design

The article's "breathing" — when the reader's eyes tense and relax.

- **Large whitespace before headings** — signals "a new section begins"
- **Moderate inter-paragraph spacing** — the pause between thoughts, like catching a breath mid-speech
- **Blockquote as "pause zone"** — visually distinct from body text, forces the reader to slow down
- **Horizontal rule as "deep breath"** — a longer pause than paragraph spacing, marks major context shifts
- **List items as "beats"** — structured, rhythmic presentation, tighter than paragraphs but more organized

#### Required Skill: `/arrange`

Use `/arrange` to validate the **visual rhythm** of the full article layout. Key checks:
- Is the spacing system consistent? (not random px values, but a deliberate scale)
- Does whitespace increase proportionally with hierarchy level?
- Do "pause zones" (blockquotes, rules) create genuine breathing room, or are they squeezed into the same rhythm as body text?
- Is there enough contrast between "dense reading" sections and "rest" sections?

---

### Phase 5 — Decoration Philosophy

Every decorative element must answer: **"Why are you here?"**

| Decoration | Good Reason | Bad Reason |
|---|---|---|
| Left border on heading | Creates hierarchy signal, guides the eye | "Other themes have it" |
| Color-block heading background | Creates visual anchor, emphasizes importance | "Looks cool" |
| Gradient blockquote background | Creates an atmospheric "pause zone" within body text | "Add some color" |
| Dark code block background | Signals "context switch" from prose to code | "Developers like dark mode" |
| Centered short underline on heading | Creates closure in centered layouts | "Decorate it" |
| Double thin-rule frame | Creates ceremonial gravity, monument inscription feel | "Pretty" |

**Core principle: Decoration is the expression of design intent, not filler.**

#### Required Skill: `/distill`

Run `/distill` on every decorative decision. `/distill` strips designs to their essence by removing unnecessary complexity. For each decorative element, ask:
- If I remove this, does the design lose meaning or just lose ornament?
- Does this decoration reinforce the emotional positioning from Phase 1, or contradict it?
- Is this decoration doing work that spacing and typography already accomplish?

**The goal is maximum impact with minimum elements.** Great design is simple, powerful, and clean. If `/distill` says remove it, remove it.

---

### Phase 6 — Color Emotion

You need only one primary color. The token system automatically derives other tints from it.

But color selection is not about picking "a nice color" — it's about choosing an **emotional light**. The same blue can evoke trust, melancholy, or tech-futurism depending on context. The table below offers reference directions, not fixed formulas:

| Color Tendency | Possible Emotions | Reference Values (examples only) |
|---|---|---|
| Desaturated blue-gray | Contemplation, restraint, professionalism | Near #5a6374 |
| Warm brown / ochre | Narrative, humanistic, nostalgic | Near #8b6f47 |
| Deep green | Stability, nature, growth | Near #2c5f2d |
| Dark purple | Mystery, creativity, depth | Near #6b4c9a |
| Deep red / dark red | Power, urgency, alertness | Near #c0392b |
| Deep blue / ink blue | Technology, frontier, profundity | Near #1a1a2e |
| Amber / warm gold | Warmth, autumn, memory | Near #d4a373 |

Choose freely based on the article's actual content and emotion. A tech article can use ink blue for cold analysis or warm gray for gentle storytelling. Don't let the table box you in.

**Three-Color Rule:** Primary color (headings, decorations) + Body text color (dark gray range, e.g., #2c2c2c – #3f3f3f) + Auxiliary color (quotes, captions — a mid-gray). More than three color families → loss of control. But exact values should be tuned freely per theme.

#### Required Skill: `/colorize`

Use `/colorize` to move beyond monochromatic or timid color choices. `/colorize` adds **strategic color** — not arbitrary color, but color that serves the emotional positioning. Key checks:
- Does the primary color reinforce the emotion from Phase 1?
- Is there enough contrast between the three color roles (primary, body, auxiliary)?
- Does the color choice create visual interest without chaos?
- Test: would a reader describe this as "has a clear color identity" or "gray and forgettable"?

---

### Phase 7 — Design Quality Gate

**Before writing any CSS, the design must pass a quality audit.**

#### Required Skills: `/audit` + `/critique`

**`/audit`** — Run a technical quality check across:
- **Accessibility**: Is contrast ratio sufficient? Are font sizes readable on mobile?
- **Consistency**: Do all design decisions flow from the same emotional positioning?
- **Hierarchy clarity**: Can a reader scan headings and understand the article's structure in 3 seconds?
- **Scoring**: Rate each dimension P0 (critical) → P3 (minor). **No P0 or P1 issues may remain before proceeding to CSS.**

**`/critique`** — Run a final design evaluation:
- Score the design against **Nielsen's 10 usability heuristics** (adapted for reading experience)
- Test with **persona archetypes**: casual scanner, focused reader, domain expert
- Assess **cognitive load**: is the design reducing or adding friction?
- Evaluate **emotional resonance**: does the design deliver on the Phase 1 promise?

**If the audit or critique reveals issues, loop back to the relevant phase and fix them before proceeding.**

---

## Part 2: CSS Implementation

After completing all design thinking phases, translate design decisions into 32 ThemeStyles CSS strings.

### 1. The 32 ThemeStyles Keys

| Key | Element | Design Responsibility |
|---|---|---|
| `container` | Outermost wrapper | Sets global font, size, line-height, max-width |
| `h1` | Level 1 heading | The article's "facade" — carries the strongest design expression |
| `h2` | Level 2 heading | Section separator, hierarchy steps down but style continues |
| `h3` | Level 3 heading | Subsection marker, decoration continues to decay |
| `h4` – `h6` | Lower-level headings | Usually pure text, differentiated by size and weight only |
| `p` | Paragraph | The reading body — line-height and spacing determine comfort |
| `strong` | Bold | Inline emphasis — color and weight should contrast with body |
| `em` | Italic | Inline soft emphasis |
| `strike` | Strikethrough | Marks deprecated content |
| `u` | Underline | Inline marking |
| `a` | Link | Clickable signal — typically primary color + underline |
| `ul` / `ol` | List containers | List marker color usually a tinted primary |
| `li` / `liText` | List items | Controls inline spacing and indentation |
| `taskList` / `taskListItem` / `taskListItemCheckbox` | Task lists | Interactive elements, accent-color uses primary |
| `blockquote` | Blockquote | The "pause zone" in reading rhythm — a core design element |
| `code` | Inline code | Small-scale context-switch signal |
| `pre` | Code block wrapper | Large-scale context switch |
| `hr` | Horizontal rule | The "deep breath" in article rhythm |
| `img` | Image | Visual focal point — typically centered with moderate whitespace |
| `tableWrapper` / `table` / `th` / `td` / `tr` | Table | Structured data display |
| `codeBlockPre` / `codeBlockCode` | Code block | Visually distinct territory from body text |

### 2. Font Stack Whitelist

WeChat does not support `@font-face`. Choose from these three stacks only:

| Key | Font Stack | Character |
|---|---|---|
| `default` | PingFang SC, system-ui, -apple-system, BlinkMacSystemFont, Helvetica Neue, Hiragino Sans GB, Microsoft YaHei UI, Microsoft YaHei, Arial, sans-serif | Modern, clear, neutral |
| `optima` | Georgia, Microsoft YaHei, PingFangSC, serif | Literary, magazine, refined |
| `serif` | Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif | Classical, dignified, timeless |

Font choice must match emotional positioning. Dignified → serif. Modern → default. Literary → optima.

#### Skill Integration: `/typeset`

Use `/typeset` to validate the font stack choice against the design's voice. `/typeset` checks readability, hierarchy clarity, and whether the typography feels intentional rather than default.

### 3. Font Size Constraints

| Element | Safe Range | Notes |
|---|---|---|
| Body text | 14–18px | WeChat optimal: 15–16px |
| H1 | 22–30px | Restraint > spectacle |
| H2 | 19–26px | — |
| H3 | 17–22px | — |
| H4–H6 | 14–18px | Can equal or be slightly smaller than body |
| Code | 13–15px | Monospace: use SF Mono / Consolas / Monaco |
| Blockquote / table | 14–16px | Can be slightly smaller than body |

**These ranges are guardrails, not targets.** Actual sizes should come from the type scale chosen in Phase 2, validated by `/typeset`.

### 4. Design Technique Reference

Common design techniques achievable within WeChat's safe CSS boundary:

**Heading Decoration:**
- Centered + double thin rules (ceremonial): `text-align: center; border-top: 1px solid; border-bottom: 1px solid; padding: 20px 16px;`
- Centered + bottom short line (chapter feel): `text-align: center; padding-bottom: 14px; background-image: linear-gradient(...); background-size: 32px 1px; background-position: center bottom; background-repeat: no-repeat;`
- Left thick border (strength): `border-left: 4px solid; padding-left: 14px;`
- Left gradient background (tech): `background: linear-gradient(90deg, rgba(...,0.08) 0%, transparent 70%); border-left: 3px solid; padding-left: 14px;`
- Full color-block card (impact): `background-color: <color>; color: #ffffff; padding: 16px 24px; border-radius: 16px;`
- Pure text (minimal / solemn): Rely only on font-size, font-weight, and letter-spacing

**Blockquote Design:**
- Thin rules top/bottom + light background + centered (book excerpt): `border-top: 1px solid; border-bottom: 1px solid; background-color: rgba(...,0.03); text-align: center;`
- Left thick border + italic (classic quote): `border-left: 3px solid; font-style: italic;`
- Gradient background + rounded corners (card quote): `background: linear-gradient(135deg, rgba(...,0.05), rgba(...,0.02)); border-radius: 0 8px 8px 0;`

**Horizontal Rule Design:**
- Centered light line (sigh): `width: 40%; margin: 3rem auto; height: 1px; background-color: rgba(...,0.2);`
- Centered triple dots (ellipsis-style): Use multi-stop `linear-gradient` via `background-image`
- Gradient fade-out (elegant vanish): `background: linear-gradient(to right, transparent, rgba(...,0.3), transparent);`

**Paragraph Design:**
- First-line indent (literary): `text-indent: 2em;`
- Standard paragraph (general): No indent, rely on inter-paragraph spacing

**Image Design:**
- Slight transparency (vintage photo): `opacity: 0.92;`
- Shadow border (polished): `border: 1px solid rgba(...,0.1); box-shadow: 0 2px 8px rgba(...,0.06);`
- Rounded corners (soft): `border-radius: 6px;`
- Clean (non-interventive): Just `max-width: 100%; display: block; margin: auto;`

### 5. Final Polish

#### Required Skill: `/polish`

Before finalizing the CSS output, run `/polish` as a final quality pass:
- Check alignment and spacing consistency across all 32 keys
- Verify that the CSS faithfully translates the design decisions from Part 1
- Catch micro-detail issues: mismatched border-radius values, inconsistent padding, color values that drift from the three-color rule
- Ensure the theme reads as a **cohesive system**, not a collection of unrelated CSS snippets

---

## Part 3: Output Format

```json
{
  "meta": {
    "id": "kebab-case-id",
    "name": "Theme Name",
    "description": "One-sentence description of design intent and target use case",
    "tags": ["emotion", "style", "font-type"],
    "createdAt": "YYYY-MM-DD",
    "version": 1
  },
  "tokens": {
    "color": "#hex",
    "fontFamily": "default | optima | serif",
    "fontSize": 16,
    "headingSizes": { "h1": 24, "h2": 20, "h3": 18, "h4": 17, "h5": 16, "h6": 15 },
    "lineHeight": 1.75,
    "paragraphSpacing": 20,
    "containerPadding": 8
  },
  "styles": {
    "container": "...",
    "h1": "...", "h2": "...", "h3": "...", "h4": "...", "h5": "...", "h6": "...",
    "p": "...", "strong": "...", "em": "...", "strike": "...", "u": "...", "a": "...",
    "ul": "...", "ol": "...", "li": "...", "liText": "...",
    "taskList": "...", "taskListItem": "...", "taskListItemCheckbox": "...",
    "blockquote": "...", "code": "...", "pre": "...", "hr": "...", "img": "...",
    "tableWrapper": "...", "table": "...", "th": "...", "td": "...", "tr": "...",
    "codeBlockPre": "...", "codeBlockCode": "..."
  }
}
```

Storage path: `{skill_dir}/clients/{client}/themes/<id>.json`, and update `clients/{client}/themes/_index.json` index.

---

## Part 4: Impeccable Skill Workflow Summary

The complete theme creation workflow with mandatory skill checkpoints:

```
Phase 1: Emotional Positioning
  └─ /critique (persona testing, emotional validation)
       │
Phase 2: Visual Personality
  ├─ /typeset (font choice, type scale)
  └─ /bolder or /quieter (calibrate intensity)
       │
Phase 3: Hierarchy Strategy
  ├─ /typeset (heading scale derivation)
  └─ /arrange (vertical rhythm, spacing)
       │
Phase 4: Rhythm Design
  └─ /arrange (full-layout rhythm validation)
       │
Phase 5: Decoration Philosophy
  └─ /distill (strip to essence, justify every element)
       │
Phase 6: Color Emotion
  └─ /colorize (strategic color, contrast validation)
       │
Phase 7: Quality Gate ← HARD GATE: do not proceed to CSS without passing
  ├─ /audit (P0–P3 technical scoring)
  └─ /critique (heuristic evaluation, persona testing)
       │
Part 2: CSS Implementation
  └─ /polish (final quality pass on all 32 keys)
```

**Any theme that skips this workflow is a failed theme.** The skills are not optional enhancements — they are the methodology.

---

## Appendix: WeChat CSS Safety Boundary

### Allowed Properties

```
color, background-color, background-image (linear-gradient only)
background-size, background-position, background-repeat
font-size, font-weight, font-style, font-family (whitelist only)
margin, padding (and directional variants)
border (and directional variants), border-radius, border-collapse
text-align, text-decoration, text-decoration-color, text-indent
text-underline-offset, text-shadow, letter-spacing
line-height, word-break, word-wrap, white-space
display (block/inline/inline-block), overflow, overflow-x, overflow-y
max-width, max-height, width, height
opacity, box-shadow
list-style-type, list-style, vertical-align, accent-color, cursor
```

### Forbidden

```
position: fixed/sticky, transform, animation, transition
filter, backdrop-filter, CSS Variables, Grid, Flexbox
@font-face, media queries, ::before/::after, float
radial-gradient, conic-gradient
```

### Critical Gotchas

1. **Every `<p>` must have explicit `color`** — WeChat does not inherit parent color
2. **Body text must never be pure black `#000`** — use `#2c2c2c` or `#3a3a3a`
3. **All styles must be inline** — no class-based styling
4. **`!important`** — recommended on margin, line-height, color to prevent WeChat overrides
5. **font-family must include full fallback chain** — use the complete whitelist strings
6. **Tables must not exceed 4 columns** — mobile screen constraint
7. **box-shadow with caution** — older Android WeChat clients may not render
8. **img max-height 600px** — prevent oversized images from breaking layout
9. **Code monospace font** — always use `"SF Mono", Consolas, Monaco, monospace`
10. **Three-color rule** — primary + body + auxiliary, no more
