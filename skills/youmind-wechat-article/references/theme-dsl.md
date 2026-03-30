# WeChat Custom Theme Design Language

> This is not a CSS property checklist. This is a design thinking protocol.
>
> When generating a theme, the AI **must** complete design thinking (Part 1) before translating decisions into CSS (Part 2).
> Skipping design thinking and jumping straight to CSS = garbage theme.
>
> Each design phase below references [Impeccable](https://impeccable.style/) skills. When Impeccable is installed, these skills fire automatically to elevate quality. **When Impeccable is not installed, the agent applies the same design principles internally** — the phases still run, just without the external skill validation layer.

---

## Impeccable Integration (Optional but Recommended)

[Impeccable](https://impeccable.style/) is a professional design skill suite that gives AI agents real design vocabulary and methodology. It is **not required** but significantly improves theme quality — especially for custom, brand-specific themes.

### Auto-Detection & Install

**Before creating a custom theme, the agent MUST check if Impeccable is installed:**

1. Look for `.impeccable.md` in the project root, OR skill files in `.cursor/skills/`, `.claude/skills/`, or `.agents/skills/` containing "impeccable" or "frontend-design".
2. If found → Impeccable is available. Use its skills at each phase checkpoint.
3. If NOT found → **proactively offer to install before proceeding:**

```
Impeccable 设计技能未安装。安装后可以显著提升自定义主题的设计质量。
是否现在安装？（约 10 秒）
```

If the user agrees, run the install command matching the current platform:

| Platform | Install Command |
| --- | --- |
| Cursor / VS Code Copilot / Kiro / Agents | `npx skills add pbakaus/impeccable --yes` |
| Claude Code | `npx skills add pbakaus/impeccable --yes` |
| Gemini CLI | `npx skills add pbakaus/impeccable --yes` |
| Codex CLI | `npx skills add pbakaus/impeccable --yes` |

After installation, run `/teach-impeccable` once to generate `.impeccable.md` (project design context). All subsequent skills read from this file automatically.

4. If the user declines → **proceed without Impeccable**. The agent applies the same design thinking principles from each phase internally. Quality is lower but the workflow still functions.

### Skills used in this DSL (when available)

| Skill | Role in Theme Creation | Without Impeccable |
| --- | --- | --- |
| `/teach-impeccable` | One-time setup — captures project design context | Agent infers context from client config |
| `/critique` | Persona testing, emotional validation, heuristic scoring | Agent self-evaluates against personas |
| `/typeset` | Font selection, type scale derivation, hierarchy validation | Agent follows type scale table in Phase 2 |
| `/bolder` | Amplify timid designs that feel generic or safe | Agent self-assesses visual intensity |
| `/quieter` | Dial back aggressive designs that feel overwhelming | Agent self-assesses visual intensity |
| `/arrange` | Vertical rhythm, spacing systems, layout validation | Agent follows spacing guidelines in Phase 4 |
| `/distill` | Strip unnecessary decoration, justify every element | Agent applies "why are you here?" test |
| `/colorize` | Strategic color selection, contrast validation | Agent follows color strategy table in Phase 6 |
| `/audit` | P0–P3 technical quality scoring | Agent runs manual checklist in Phase 7 |
| `/polish` | Final micro-detail pass before output | Agent does final consistency review |

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
| Misty & Contemplative | Low-contrast palette, thin hairline rules, ample whitespace, muted auxiliary colors, slow rhythm | Not "washed out" — it's visual quietude |
| Magazine & Editorial | Mixed serif/sans pairing, pull-quote emphasis, strict vertical rhythm, drop-cap energy | Not "cluttered" — it's editorial structure |
| Vintage & Nostalgic | Warm sepia tones, subtle texture-like backgrounds, slightly rounded serif, ornamental hr | Not "old-fashioned" — it's curated nostalgia |
| Minimalist & Brutalist | One accent color max, zero decoration, raw type hierarchy, extreme whitespace, sharp contrast | Not "lazy" — it's radical intention |
| Nature & Organic | Earthy greens and browns, soft rounded corners, gentle gradients, relaxed density | Not "hippie" — it's grounded calm |
| Luxury & Premium | Deep navy/black/gold palette, generous letter-spacing, restrained decoration, thick-thin rule contrast | Not "gaudy" — it's quiet confidence |
| Narrative & Cinematic | Wide line-height, centered layout, dramatic heading scale, fade-out hr, image-driven rhythm | Not "dramatic" for drama's sake — it's pacing |
| Academic & Scholarly | Tight type scale, numbered headings, footnote-style blockquotes, indented paragraphs, neutral palette | Not "dry" — it's intellectual precision |

**Write a one-sentence emotional positioning before continuing.**

#### Skill Checkpoint: `/critique`

If Impeccable is installed, run `/critique`. Otherwise, evaluate mentally:
- Does this emotion match the article's content and audience?
- Test against **persona archetypes**: would a first-time reader, a domain expert, and a casual scanner all receive the intended emotional signal?
- Assess **cognitive load**: does the emotional direction risk overwhelming or underwhelming the reader?

---

### Phase 2 — Visual Personality

Define the theme's "character" — if this layout were a person, what would they be like?

Answer three questions:

**Volume** — Is this theme whispering or giving a keynote?
- Whisper: font-weight 400–500, no background colors on headings, semi-transparent decorations, hairline borders
- Murmur: font-weight 500–600, subtle tinted backgrounds, thin borders, gentle shadows
- Normal: font-weight 600–700, moderate decoration, clear but not attention-grabbing
- Keynote: font-weight 700–800, color-block heading backgrounds, high contrast, bold borders
- Shout: font-weight 800–900, full-bleed color blocks, oversized headings, maximal contrast

**Temperature** — Warm or cool palette?
- Icy: pure white background, slate/steel blue accents → clinical, cutting-edge
- Cool: blue-gray, indigo, teal → rational, distant, contemplative
- Neutral: pure grays, minimal color → restrained, professional
- Warm: ochre, amber, warm brown → intimate, narrative, humanistic
- Hot: deep red, terracotta, burnt orange → passionate, urgent, visceral

**Density** — How tightly packed are elements?
- Airy: paragraph spacing 28–36px, line-height 2.0–2.2, extreme whitespace → meditative, poetic
- Spacious: paragraph spacing 22–28px, line-height 1.8–2.0, generous whitespace → settling, reading-focused
- Balanced: paragraph spacing 18–22px, line-height 1.7–1.8 → equilibrium
- Compact: paragraph spacing 12–16px, line-height 1.6–1.7 → information-dense, efficient
- Dense: paragraph spacing 8–12px, line-height 1.5–1.6 → data-heavy, reference-style

**Texture** — What surface does this feel like?
- Glass: transparent/translucent backgrounds, subtle shadows, light borders → modern digital
- Paper: warm off-white implied by color choices, gentle tones, serif fonts → analog reading
- Stone: high-contrast, heavy rules, strong borders, dark headers → monumental, lasting
- Silk: gentle gradients, rounded edges, soft shadows, flowing rhythm → premium, refined
- Raw: no gradients, no shadows, no border-radius, stark contrast → honest, unadorned

#### Skill Checkpoint: `/typeset` + `/bolder` or `/quieter`

If Impeccable is installed, use these skills. Otherwise, apply the principles manually:

- **`/typeset`** (or manually): Validate font choices against the volume and temperature decisions. Use **fixed type scales** — don't invent arbitrary font sizes. Pick a coherent scale (e.g., Major Third 1.25, Perfect Fourth 1.333) that produces the right hierarchy for the chosen volume level.
- **`/bolder`** (or manually): If the initial personality feels too safe, bland, or generic — amplify visual impact while maintaining usability. Push past the "default AI aesthetic."
- **`/quieter`** (or manually): If the personality feels too aggressive, garish, or overstimulating — dial back intensity while preserving design quality. Reduce without making it lifeless.

**Calibration loop**: After defining visual personality, run `/bolder` or `/quieter` (or self-assess) as needed until the personality feels intentional, not accidental. A theme should feel _designed_, not _defaulted_.

---

### Phase 3 — Hierarchy Strategy

Headings are not just "big text." They are the article's skeleton — the navigation readers use when scanning.

**Methods for establishing hierarchy** (combine multiple):

| Method | Effect | Example |
|---|---|---|
| Size difference | Most direct hierarchy signal | H1 24px → H2 20px → H3 18px |
| Weight variation | Creates light/heavy contrast at same size | H1 800 → H3 600 → H5 400 |
| Color depth | Higher levels = deeper color | H1 #1a1a1a → H3 #5a6374 → H5 #888 |
| Decoration decay | Decoration decreases with level | H1 full-color-block → H2 left-border → H3 underline → H4 none |
| Alignment shift | High levels centered, low levels left | H1–H2 centered → H3+ left-aligned |
| Spacing rhythm | Higher levels = more top margin | H1 margin-top 56px → H3 36px → H5 20px |
| Background intensity | Background saturation/opacity decreases with level | H1 solid bg → H2 rgba(…,0.12) → H3 rgba(…,0.05) |
| Letter-spacing shift | Higher levels use wider tracking | H1 letter-spacing: 2px → H3 1px → H5 normal |
| Border style variation | Border style changes with level | H1 double → H2 solid → H3 dashed → H4 dotted |
| Opacity gradient | Lower headings fade toward body text | H1 opacity:1 → H4 opacity:0.85 → H6 opacity:0.7 |

**Core principle: Never use just one method.** The best hierarchy layers multiple signals into a cohesive whole.

#### Skill Checkpoint: `/typeset` + `/arrange`

If Impeccable is installed, use these skills. Otherwise, apply the principles manually:

- **`/typeset`** (or manually): Derive heading sizes from a **type scale**, not arbitrary numbers. The type scale must produce clear visual separation between levels while maintaining harmonic relationships. Validate that font weight, size, and color work together — don't just crank up font-size and call it hierarchy.
- **`/arrange`** (or manually): Validate **vertical rhythm** and spacing between hierarchy levels. The spacing between headings and body text is not arbitrary — it signals structural relationships. Check for monotonous grids, inconsistent spacing, and weak visual hierarchy.

---

### Phase 4 — Rhythm Design

The article's "breathing" — when the reader's eyes tense and relax.

- **Large whitespace before headings** — signals "a new section begins"
- **Moderate inter-paragraph spacing** — the pause between thoughts, like catching a breath mid-speech
- **Blockquote as "pause zone"** — visually distinct from body text, forces the reader to slow down
- **Horizontal rule as "deep breath"** — a longer pause than paragraph spacing, marks major context shifts
- **List items as "beats"** — structured, rhythmic presentation, tighter than paragraphs but more organized

#### Skill Checkpoint: `/arrange`

If Impeccable is installed, use `/arrange`. Otherwise, validate the **visual rhythm** manually. Key checks:
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

#### Skill Checkpoint: `/distill`

If Impeccable is installed, run `/distill` on every decorative decision. Otherwise, strip designs to their essence manually. For each decorative element, ask:
- If I remove this, does the design lose meaning or just lose ornament?
- Does this decoration reinforce the emotional positioning from Phase 1, or contradict it?
- Is this decoration doing work that spacing and typography already accomplish?

**The goal is maximum impact with minimum elements.** Great design is simple, powerful, and clean. If the answer is "just ornament," remove it.

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
| Teal / cyan | Freshness, clarity, modern energy | Near #0d9488 |
| Muted rose / mauve | Elegance, softness, editorial warmth | Near #b5838d |
| Slate / charcoal | Neutral authority, understated confidence | Near #475569 |
| Burnt sienna / terracotta | Earthy warmth, artisan craft, organic | Near #a0522d |
| Forest / olive | Wisdom, endurance, quiet strength | Near #556b2f |
| Coral / salmon | Approachable energy, friendly warmth | Near #e07a5f |
| Navy / midnight | Depth, formality, premium weight | Near #1e3a5f |
| Dusty lavender | Gentle creativity, calm imagination | Near #9b8ec1 |

Choose freely based on the article's actual content and emotion. A tech article can use ink blue for cold analysis or warm gray for gentle storytelling. Don't let the table box you in.

**Color Strategy (flexible, not rigid):** Assign colors by role, not by counting them. The roles are:

| Role | Purpose | Example |
|---|---|---|
| Primary | Headings, key decorations, links | Your chosen emotional color |
| Body | Paragraph text — must be readable | #2c2c2c – #444444 range |
| Auxiliary | Quotes, captions, secondary text | Mid-gray: #666 – #999 |
| Accent (optional) | Highlight, inline-code bg, table header bg | A tint of primary at 8–15% opacity |
| Surface (optional) | Blockquote bg, card bg, code block bg | Near-white tints or dark surfaces |

Three roles (primary + body + auxiliary) is the safest floor. Four or five roles (adding accent + surface) is perfectly fine when they derive from the same primary. The rule is **coherence, not counting** — five colors from one family are more controlled than two random colors.

#### Skill Checkpoint: `/colorize`

If Impeccable is installed, use `/colorize`. Otherwise, evaluate color strategy manually. The goal is **strategic color** — not arbitrary color, but color that serves the emotional positioning. Key checks:
- Does the primary color reinforce the emotion from Phase 1?
- Is there enough contrast between the three color roles (primary, body, auxiliary)?
- Does the color choice create visual interest without chaos?
- Test: would a reader describe this as "has a clear color identity" or "gray and forgettable"?

---

### Phase 7 — Design Quality Gate

**Before writing any CSS, the design must pass a quality audit.**

#### Skill Checkpoint: `/audit` + `/critique`

If Impeccable is installed, run both skills. Otherwise, perform the quality checks manually:

**`/audit`** (or manual checklist) — Run a technical quality check across:
- **Accessibility**: Is contrast ratio sufficient? Are font sizes readable on mobile?
- **Consistency**: Do all design decisions flow from the same emotional positioning?
- **Hierarchy clarity**: Can a reader scan headings and understand the article's structure in 3 seconds?
- **Scoring**: Rate each dimension P0 (critical) → P3 (minor). **No P0 or P1 issues may remain before proceeding to CSS.**

**`/critique`** (or manual evaluation) — Run a final design evaluation:
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

### 3. Font Size Guidelines

| Element | Comfortable Range | Extended Range | Notes |
|---|---|---|---|
| Body text | 15–17px | 14–18px | 15–16px is the mobile sweet spot, but 14px works for dense content and 18px for airy layouts |
| H1 | 22–28px | 20–36px | Up to 36px is safe for single-line impact headings; multi-line headings should stay ≤28px |
| H2 | 19–24px | 17–28px | — |
| H3 | 17–20px | 15–24px | — |
| H4–H6 | 15–18px | 14–20px | Can equal body or go slightly smaller for de-emphasized sub-sections |
| Code (inline) | 13–15px | 12–16px | Monospace: SF Mono / Menlo / Consolas / Monaco |
| Code (block) | 13–15px | 12–16px | Same as inline; ensure line-height ≥ 1.5 for readability |
| Blockquote | 14–16px | 13–17px | Slightly smaller than body signals "aside" |
| Table | 14–16px | 13–16px | Compact tables can go to 13px |
| Caption / footnote | 12–14px | 12–14px | For image captions and annotations |

**The comfortable range** is where most themes should land. **The extended range** is available when the design intent demands it — a "shout" volume heading at 34px is valid if the theme's personality calls for it, just as a 14px body suits a dense academic layout.

Actual sizes should come from the type scale chosen in Phase 2, validated by `/typeset`. Popular type scales:

| Scale | Ratio | Character |
|---|---|---|
| Minor Second | 1.067 | Subtle, barely perceptible steps — academic, dense |
| Major Second | 1.125 | Gentle progression — professional, restrained |
| Minor Third | 1.2 | Clear but modest hierarchy — balanced, readable |
| Major Third | 1.25 | Strong hierarchy — the most popular for articles |
| Perfect Fourth | 1.333 | Dramatic steps — editorial, magazine |
| Augmented Fourth | 1.414 | Bold jumps — keynote, impactful |
| Perfect Fifth | 1.5 | Extreme contrast — use for hero-style H1 only |

### 4. Design Technique Reference

A rich library of design techniques achievable within WeChat's CSS boundary. Mix and match freely — the best themes combine techniques from multiple categories.

---

#### Heading Decoration

**Structural approaches:**
- Centered + double thin rules (ceremonial): `text-align: center; border-top: 1px solid; border-bottom: 1px solid; padding: 20px 16px;`
- Centered + bottom short line (chapter feel): `text-align: center; padding-bottom: 14px; background-image: linear-gradient(COLOR, COLOR); background-size: 40px 2px; background-position: center bottom; background-repeat: no-repeat;`
- Centered + top short accent line: `text-align: center; padding-top: 16px; background-image: linear-gradient(COLOR, COLOR); background-size: 24px 3px; background-position: center top; background-repeat: no-repeat;`
- Left thick border (strength): `border-left: 4px solid; padding-left: 14px;`
- Left double border (editorial): `border-left: 4px double; padding-left: 14px;`
- Left gradient strip: `border-left: 3px solid; background: linear-gradient(90deg, rgba(...,0.08) 0%, transparent 60%); padding: 8px 14px;`
- Bottom gradient underline (modern): `padding-bottom: 8px; background-image: linear-gradient(90deg, COLOR 0%, transparent 100%); background-size: 100% 2px; background-position: bottom left; background-repeat: no-repeat;`

**Surface approaches:**
- Full color-block card (impact): `background-color: COLOR; color: #ffffff; padding: 16px 24px; border-radius: 16px;`
- Tinted card (soft impact): `background-color: rgba(...,0.08); padding: 12px 20px; border-radius: 8px;`
- Gradient card: `background: linear-gradient(135deg, rgba(...,0.12) 0%, rgba(...,0.04) 100%); padding: 14px 20px; border-radius: 10px;`
- Top-border card: `border-top: 3px solid COLOR; background-color: rgba(...,0.03); padding: 14px 20px;`
- Bottom-border + shadow (floating): `border-bottom: 2px solid COLOR; padding-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.06);`
- Pill label (tag-like): `display: inline-block; background-color: COLOR; color: #fff; padding: 6px 20px; border-radius: 100px; font-size: 14px;`

**Minimal approaches:**
- Pure text (minimal): Rely only on font-size, font-weight, and letter-spacing
- Weight-only hierarchy: Same color as body, differentiated purely by font-weight (800 → 600 → 400)
- Uppercase letter-spacing (western feel): `letter-spacing: 3px; font-size: 13px; font-weight: 600; text-transform: uppercase;`
- Numbered prefix (academic): Pair with manual numbering in Markdown, no decoration CSS needed

---

#### Blockquote Design

- Left thick border + italic (classic): `border-left: 3px solid; font-style: italic; padding: 12px 16px;`
- Left thick border + tinted bg (standard): `border-left: 4px solid COLOR; background-color: rgba(...,0.04); padding: 16px 20px;`
- Thin rules top/bottom + centered (book excerpt): `border-top: 1px solid rgba(...,0.3); border-bottom: 1px solid rgba(...,0.3); padding: 20px 16px; text-align: center;`
- Gradient card + rounded (modern): `background: linear-gradient(135deg, rgba(...,0.06), rgba(...,0.02)); border-radius: 0 12px 12px 0; border-left: 3px solid COLOR; padding: 16px 20px;`
- Full tinted card (callout): `background-color: rgba(...,0.06); border-radius: 8px; padding: 16px 20px; border: 1px solid rgba(...,0.1);`
- Dark surface card (contrast): `background-color: #2d3748; color: #e2e8f0 !important; padding: 20px 24px; border-radius: 8px;`
- Left color-block accent: `border-left: 6px solid COLOR; padding: 16px 20px; background-color: rgba(...,0.02);`
- Indented + smaller (footnote style): `margin-left: 24px; font-size: 14px; color: #888 !important; border: none; padding: 0;`
- Pull-quote (editorial): `text-align: center; font-size: 20px; font-weight: 600; color: COLOR !important; padding: 24px 32px; border: none; letter-spacing: 0.5px; line-height: 1.6;`

---

#### Horizontal Rule Design

- Centered light line: `width: 40%; margin: 3rem auto; height: 1px; background-color: rgba(...,0.2);`
- Centered short accent: `width: 60px; margin: 2.5rem auto; height: 3px; background-color: COLOR; border-radius: 2px;`
- Gradient fade-out: `margin: 3rem 0; height: 1px; background: linear-gradient(to right, transparent, rgba(...,0.3), transparent);`
- Double thin line: `margin: 2.5rem 0; height: 4px; border-top: 1px solid rgba(...,0.15); border-bottom: 1px solid rgba(...,0.15); background: transparent;`
- Dotted line: `margin: 2rem 0; border: none; border-top: 2px dotted rgba(...,0.2);`
- Dashed line: `margin: 2rem 0; border: none; border-top: 1px dashed rgba(...,0.25);`
- Full-width solid (brutalist): `margin: 3rem 0; height: 2px; background-color: #1a1a1a;`
- Gradient accent bar: `margin: 2.5rem auto; width: 80%; height: 2px; background: linear-gradient(90deg, COLOR, rgba(...,0.1));`
- Three dots (ellipsis): `width: 60px; margin: 2rem auto; height: 6px; background-image: radial-gradient(circle, rgba(...,0.4) 1.5px, transparent 1.5px); background-size: 20px 6px; background-position: center; background-repeat: repeat-x; border: none;`

---

#### Paragraph Design

- Standard (general): No indent, rely on inter-paragraph spacing
- First-line indent (literary): `text-indent: 2em;`
- Wide leading (contemplative): `line-height: 2.0; margin-bottom: 28px;`
- Tight leading (dense): `line-height: 1.6; margin-bottom: 12px;`
- Justified (formal): `text-align: justify;`
- Left-align + generous spacing: `text-align: left; margin-bottom: 24px; line-height: 1.85;`
- Slightly larger first paragraph: Use on the opening `<p>` only: `font-size: 17px; line-height: 1.8; color: #333 !important;`

---

#### Image Design

- Clean (non-interventive): `max-width: 100%; display: block; margin: 32px auto;`
- Rounded corners (soft): `border-radius: 8px; max-width: 100%; display: block; margin: 28px auto;`
- Shadow frame (polished): `border-radius: 6px; border: 1px solid rgba(...,0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.08); max-width: 100%; display: block; margin: 32px auto;`
- Heavy shadow (dramatic): `box-shadow: 0 8px 32px rgba(0,0,0,0.15); border-radius: 8px; max-width: 100%; display: block; margin: 36px auto;`
- Slight transparency (vintage): `opacity: 0.9; border-radius: 4px; max-width: 100%; display: block; margin: 28px auto;`
- Border frame (gallery): `border: 4px solid #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.1); max-width: 100%; display: block; margin: 32px auto;`
- Full-bleed (no margin): `max-width: 100%; display: block; margin: 20px 0;`

---

#### Table Design

- Clean minimal: Light borders only, no header background
- Striped (implied via alternating td background-color in generated HTML): Alternate `rgba(...,0.03)` on even rows
- Bordered + header accent: `th` with `background-color: COLOR; color: #fff;`, `td` with `border: 1px solid rgba(...,0.12);`
- Borderless + bold header: No cell borders, `th` with `border-bottom: 2px solid COLOR; font-weight: 700;`
- Card-style: `table` with `box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-radius: 8px; overflow: hidden;`

---

#### Inline Emphasis Design

- **Bold color**: `strong` with `font-weight: 700; color: COLOR;` — the standard
- **Bold + background highlight**: `strong` with `font-weight: 700; background-color: rgba(...,0.1); padding: 1px 4px; border-radius: 3px;`
- **Underline emphasis**: `strong` with `font-weight: 700; text-decoration: underline; text-decoration-color: rgba(...,0.4); text-underline-offset: 3px;`
- **Subtle bold (no color change)**: `strong` with `font-weight: 700; color: #2c2c2c;` — emphasis without distraction
- **Inline code as emphasis**: `code` with tinted background and primary color text creates an alternative emphasis channel

---

#### Code Block Design

- Light surface (minimal): `background-color: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); border-radius: 0;`
- Dark surface (standard): `background-color: #1e1e1e; color: #d4d4d4; border-radius: 6px;`
- Colored dark (themed): `background-color: #2d3748; border: 1px solid rgba(COLOR,0.2); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);`
- Paper (warm): `background-color: #faf8f5; border: 1px solid #e8e0d4; border-radius: 4px; color: #3a3a3a;`
- Inset (depressed): `background-color: #f5f5f5; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06); border-radius: 4px;`

### 5. Final Polish

#### Skill Checkpoint: `/polish`

If Impeccable is installed, run `/polish`. Otherwise, perform a final quality pass manually:
- Check alignment and spacing consistency across all 32 keys
- Verify that the CSS faithfully translates the design decisions from Part 1
- Catch micro-detail issues: mismatched border-radius values, inconsistent padding, color values that drift from the color strategy
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

## Part 4: Theme Creation Workflow Summary

The complete theme creation workflow. At each checkpoint, use Impeccable skills if installed; otherwise apply the same design principles manually.

```
[Pre-check] Is Impeccable installed?
  ├─ Yes → Skills fire automatically at each checkpoint
  └─ No  → Offer install. If declined, agent applies principles internally.
       │
Phase 1: Emotional Positioning
  └─ checkpoint: /critique (persona testing, emotional validation)
       │
Phase 2: Visual Personality
  ├─ checkpoint: /typeset (font choice, type scale)
  └─ checkpoint: /bolder or /quieter (calibrate intensity)
       │
Phase 3: Hierarchy Strategy
  ├─ checkpoint: /typeset (heading scale derivation)
  └─ checkpoint: /arrange (vertical rhythm, spacing)
       │
Phase 4: Rhythm Design
  └─ checkpoint: /arrange (full-layout rhythm validation)
       │
Phase 5: Decoration Philosophy
  └─ checkpoint: /distill (strip to essence, justify every element)
       │
Phase 6: Color Emotion
  └─ checkpoint: /colorize (strategic color, contrast validation)
       │
Phase 7: Quality Gate ← HARD GATE: do not proceed to CSS without passing
  ├─ checkpoint: /audit (P0–P3 technical scoring)
  └─ checkpoint: /critique (heuristic evaluation, persona testing)
       │
Part 2: CSS Implementation
  └─ checkpoint: /polish (final quality pass on all 32 keys)
```

**Any theme that skips this design thinking workflow is a failed theme.** The phases are the methodology — Impeccable skills enhance execution but are not the only way to follow them.

---

## Appendix: WeChat CSS Safety Boundary

### Tier 1 — Fully Safe (use freely)

```
color, background-color
background-image: linear-gradient() — all directions, multi-stop, rgba values
background-size, background-position, background-repeat
font-size, font-weight, font-style, font-family (system stacks only)
margin, padding (and all directional variants: -top, -right, -bottom, -left)
border (and all directional variants), border-radius, border-collapse, border-style, border-color
text-align, text-decoration, text-decoration-color, text-decoration-style, text-indent
text-underline-offset, text-shadow, letter-spacing, word-spacing
line-height, word-break, word-wrap, overflow-wrap, white-space
display: block / inline / inline-block / table / table-cell / table-row
overflow, overflow-x, overflow-y
max-width, min-width, width, max-height, min-height, height
opacity, box-shadow (single and multi-layer)
list-style-type, list-style, list-style-position
vertical-align, accent-color, cursor
float: left / right (works, useful for text-wrapping layouts)
clear: both / left / right
```

### Tier 2 — Works on Modern Clients (use with awareness)

These properties work on iOS WeChat and Android WeChat 8.0+. The overwhelming majority of active users are on these versions.

```
background-image: radial-gradient() — works for decorative backgrounds and dot patterns
background-clip: padding-box / border-box
border-image (limited — simple gradients work)
text-overflow: ellipsis
outline, outline-offset
writing-mode: vertical-rl (for vertical Chinese text effects — niche but dramatic)
box-shadow with multiple layers (up to 3 layers render reliably)
background-image with multiple layers (comma-separated, up to 3)
mix-blend-mode (partial — works on some clients, gracefully ignored on others)
```

### Forbidden (will break or be stripped)

```
position: fixed / sticky / absolute (relative is OK in limited cases)
transform, animation, transition, @keyframes
filter, backdrop-filter
CSS Variables (var(--x)), CSS Custom Properties
CSS Grid, Flexbox (display: flex / grid)
@font-face, @import, @media
::before, ::after (pseudo-elements)
conic-gradient
pointer-events
z-index (no stacking context without position)
clip-path
```

### Gotchas & Best Practices

1. **Every `<p>` must have explicit `color`** — WeChat does not inherit parent color reliably
2. **Body text: avoid pure black `#000`** — use `#2c2c2c` – `#444444` for comfortable reading
3. **All styles must be inline** — `style=""` attribute on each element, no `<style>` blocks or classes
4. **`!important` on critical properties** — recommended for `margin`, `line-height`, `color`, `padding` to prevent WeChat's own stylesheet from overriding
5. **font-family must include full fallback chain** — always use the complete stack strings from Section 2
6. **Tables: ≤ 4 columns** — mobile screen constraint; use 2–3 columns when possible
7. **box-shadow** — single-layer shadows are near-universal; multi-layer shadows may simplify on very old Android clients
8. **img max-height** — recommend 600px to prevent oversized images; can go up to 800px for full-width photo essays
9. **Code monospace font** — use `"SF Mono", Menlo, Consolas, Monaco, "Courier New", monospace`
10. **`border-radius` large values** — up to `100px` or `50%` works for pill shapes and circles
11. **`background-image` multi-stop gradients** — complex gradients with 3–5 color stops are safe; great for decorative lines, dots, and patterns
12. **`text-shadow` for depth** — subtle `0 1px 2px rgba(0,0,0,0.06)` adds dimension to headings; avoid heavy blur-radius
13. **Nesting inline styles** — deeply nested elements (li > span > strong) all need their own inline styles
14. **`letter-spacing` range** — -0.05em to 4px is safe; wider tracking for headings, tight tracking for dense body
15. **`display: inline-block`** — useful for pill-shaped headings, inline badges, and tag-like elements
