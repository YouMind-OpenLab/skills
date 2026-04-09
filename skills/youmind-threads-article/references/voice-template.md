# Voice Profile Template

Each profile's `voice.yaml` defines how the agent should write for that persona / use case.
Multiple profiles are supported (e.g. `personal`, `company`, `tech-deep`).

## Full Schema

```yaml
name: "default"             # profile identifier, matches directory name
created_at: "2026-04-09"    # ISO date

tone: "技术同行聊天：有梗但不刻意，敢吐槽但不酸，用行内缩写但会给必要解释"
persona: "在 AI/编程行业泡了 5 年，写代码也写思考，对炒作本能反感"
pov: "第一人称单数，偶尔用「我们」指代从业者群体"

chain:
  length_preference: "short"    # short (3-5) / medium (6-10) / long (11+)
  hook_style: "反常识陈述"       # 反常识陈述 / 尖锐提问 / 场景白描 / 数据冲击
  payoff_required: true         # 是否强制要求结尾收束

hashtags:
  strategy: "none"              # inline / trailing / none
  max_count: 0

reference_threads: []           # 用户认为风格可参考的 permalink 列表
blacklist_words: []             # 绝对不要出现的词（例如 "说实话"、"讲真"）
```

## 字段详解

### `tone`（必填，自由文本）
一段描述，告诉 agent 整体语气应该是什么样。越具体越好：
- ❌ "专业" —— 太抽象
- ✅ "技术同行聊天：有梗但不刻意，敢吐槽但不酸"

### `persona`（必填，自由文本）
这个 profile 的"人"是谁。包括职业背景、立场、对行业的态度。Agent 会用这个决定 POV 和例子。

### `pov`（必填）
叙事视角。常见值：
- "first person singular" / "第一人称单数"
- "first person plural" / "第一人称复数（代表团队）"
- "third person" / "第三人称（企业/机构口吻）"

### `chain.length_preference`（必填）
| 值 | 段数 |
| --- | --- |
| `short` | 3-5 段 |
| `medium` | 6-10 段 |
| `long` | 11+ 段 |

### `chain.hook_style`（必填）
第 1 段 hook 的主风格。四种常见值：
- "反常识陈述"
- "尖锐提问"
- "场景白描"
- "数据冲击"

也可以用英文或其他自由描述。

### `chain.payoff_required`（布尔）
- `true`：结尾段必须有明确收束（带走一个观点/动作/问题）
- `false`：可以开放式结尾

### `hashtags.strategy`（必填）
| 值 | 含义 |
| --- | --- |
| `inline` | 第一个 tag 内嵌进最后一句尾部，其余 tag trailing |
| `trailing` | 所有 tag 集中放在贴子末尾 |
| `none` | 不加 hashtag |

### `hashtags.max_count`（整数）
上限。即使 agent 提出 5 个相关 tag，也只会用前 `max_count` 个。`strategy: none` 时无视此字段。

### `reference_threads`（URL 数组）
用户认为"风格类似"的 Threads 贴子 permalink。Agent 可以参考（但不能抄）。可为空。

### `blacklist_words`（字符串数组）
绝对不能出现的词。Agent 在写作时强制过滤。例如 `["说实话", "讲真", "不得不说"]`。

## 创建方式

通常不需要手写这个 YAML。SKILL.md 会指导 agent 首次使用时通过 `AskUserQuestion`（或文本多选）询问用户，然后用 CLI 的 `profile create` 子命令生成：

```bash
npx tsx src/cli.ts profile create \
  --name default \
  --tone "技术同行聊天" \
  --length short \
  --hashtags none
```

其余字段用默认值填充。高级用户可以直接编辑 `profiles/<name>/voice.yaml` 精调。

## 多 Profile 使用

每个 profile 对应 `profiles/<name>/` 目录下的一组文件。通过 `--profile <name>` 参数指定：

```bash
npx tsx src/cli.ts publish output/draft.md --profile company
npx tsx src/cli.ts preview "..." --profile personal
```

不指定时默认为 `default`。
