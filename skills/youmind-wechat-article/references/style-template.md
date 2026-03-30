# Client Configuration Template

> When creating a new client, copy `clients/demo/style.yaml` and customize the fields below.
> Every field shapes how the agent writes, selects topics, and formats articles for this client.

---

## Template

```yaml
name: "Client Name"
industry: "Industry / vertical"
target_audience: "Specific audience persona (age, role, interests, context)"

topics:
  - Core vertical 1
  - Core vertical 2
  - Core vertical 3

tone: "Voice description (e.g., 专业但不学术，有观点但不偏激，偶尔自嘲)"
voice: "POV and persona (e.g., 第一人称，像一个懂行的朋友在分享见解)"
word_count: "1500-2500"
content_style: "干货 / 故事 / 观点 / 混合"

blacklist:
  words: [word1, word2, word3]
  topics: [forbidden topic 1, forbidden topic 2]

reference_accounts: [Account1, Account2, Account3]

# Theme engine settings (overridden by CLI --theme / --color)
theme: "simple"           # Built-in: simple | center | decoration | prominent
                          #           ink-literary | tech-deep | warm-narrative
                          #           jade-fresh | rose-editorial | mist-minimal
                          # Or: any custom theme ID from clients/{client}/themes/
theme_color: "#3498db"    # Any HEX color. Overrides the theme's primary color.

# Typography overrides (optional — leave empty for theme defaults)
font: ""                  # default | optima | serif
font_size: ""             # e.g., "16px" — body text size
heading_font: ""          # e.g., "serif" — use a different font stack for headings
heading_size: ""          # e.g., "18px"
paragraph_spacing: ""     # e.g., "1.5em"
line_height: ""           # e.g., "1.85"
letter_spacing: ""        # e.g., "0.5px"
text_indent: ""           # e.g., "2em" — first-line indent for literary styles

# YouMind 知识库关联 (可选 — 需要在 config.yaml 配置 youmind.api_key)
youmind:
  source_boards: []          # 素材来源 board ID 列表 (写文章时自动搜索这些 board 中的素材)
  save_board: ""             # 发布后归档到的 board ID (留空不归档)

cover_style: "Cover image style description for AI image generation"
author: "Author name displayed on article"
```

---

## Field Guide

### `tone` — How It Affects Writing

The tone field is injected into the writing persona. Be specific:

| Vague (BAD) | Specific (GOOD) |
|-------------|----------------|
| "专业" | "专业但不学术——像资深从业者跟新人聊天，不是教授在讲课" |
| "有趣" | "偶尔自嘲，敢用网络梗，但不刻意搞笑——幽默是调味料不是主菜" |
| "亲切" | "像一个你认识了五年的同事，说话直接但不冒犯" |

### `voice` — The Persona Layer

This defines WHO is writing. The more specific, the more consistent the output:

| Vague (BAD) | Specific (GOOD) |
|-------------|----------------|
| "第一人称" | "第一人称，36岁，在互联网行业做了10年产品，去年开始独立咨询" |
| "专家视角" | "像一个在这个行业见过太多坑的老兵，对套路有本能的反感" |

### `content_style` — Framework Bias

| Value | Effect |
|-------|--------|
| 干货 | Favors Pain-Point and Listicle frameworks. Prioritizes actionable value. |
| 故事 | Favors Story framework. Prioritizes narrative and emotion. |
| 观点 | Favors Comparison and Hot Take frameworks. Prioritizes unique perspective. |
| 混合 | No framework bias. Selects based on topic characteristics. |

### `reference_accounts` — Style Calibration

List 2-3 WeChat accounts whose style you want to emulate. The agent uses these as implicit style references when making voice and tone decisions.

### `youmind` — Knowledge Base Integration

Optional. Requires `youmind.api_key` in `config.yaml`.

| Field | Effect |
|-------|--------|
| `source_boards` | Agent searches these boards for relevant materials/documents as writing references. Leave empty to search all. |
| `save_board` | After publishing, the article is archived to this board as a YouMind document. Leave empty to skip. |

### `blacklist` — Hard Boundaries

- `words`: These words will NEVER appear in any generated content
- `topics`: These topics will be filtered out during topic selection, regardless of score

---

## Directory Structure

```
clients/{client}/
├── style.yaml      # Required: client configuration
├── history.yaml    # Auto-generated: publishing history + stats
├── playbook.md     # Optional: writing manual generated from corpus analysis
├── corpus/         # Optional: historical articles for playbook generation
├── lessons/        # Auto-generated: patterns learned from human edits
└── themes/         # Custom theme JSONs (skill-update safe)
```

### `playbook.md` — When It Exists

If a playbook exists, it takes **priority over writing-guide.md** for this client. The playbook captures client-specific voice patterns, preferred structures, and recurring themes discovered from analyzing their historical articles.

The general writing-guide.md remains the quality floor — the playbook customizes on top of it.

### `history.yaml` — Feedback Loop

History entries include optional `stats` (reads, shares, likes, completion rate). When stats exist, the agent uses them to:
- Identify which frameworks perform best for this audience
- Detect which title strategies drive highest CTR
- Adjust topic selection weights based on historical performance
