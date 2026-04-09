# Threads Content Adaptation Rules

这份文档列出 Meta Threads 的**硬约束**（来自官方文档）以及本 skill 针对每段做的段级校验。

## 文本硬约束

| 项 | 限制 |
| --- | --- |
| 单条帖子长度 | ≤ 500 字符（含 emoji，按 UTF-16 code unit 计数） |
| 单条帖子 URL 数 | ≤ 5 |
| 回复 | 支持（用 `reply_to_id`） |
| Carousel（2-20 图） | v1 **不支持**，延后到 v1.1 |

**技术说明**：JavaScript 的 `String.prototype.length` 返回 UTF-16 code unit 数，对大部分内容（包括 ASCII、中文、大多数 emoji）是准确的。少数 skin-tone 组合 emoji 会被 JS 多计，但 Meta 的计数在实践中与 JS `length` 相符。严格的 grapheme 计数（`Intl.Segmenter`）超出 v1 范围。

## 图片硬约束

| 项 | 限制 |
| --- | --- |
| 格式 | JPEG / PNG（Meta 只支持这两种） |
| 文件大小 | ≤ 8 MB |
| 宽度 | 320 - 1440 px |
| 宽高比 | ≤ 10:1 |

**客户端能检查的**：格式（Content-Type header）、大小（Content-Length header）。
**服务端才能检查的**：宽度、宽高比。这些会在 YouMind `/threads/createContainer` 时由 Meta 反馈错误。

## 视频硬约束

| 项 | 限制 |
| --- | --- |
| 容器 | MP4 / MOV |
| 时长 | ≤ 300 秒（5 分钟） |
| 文件大小 | ≤ 1 GB |
| 帧率 | 23 - 60 FPS |
| 分辨率 | 水平方向最大 1920 px，推荐 9:16 |

**客户端能检查的**：容器（Content-Type）、大小（Content-Length）。
**服务端才能检查的**：时长、帧率、分辨率。

## 发布速率限制（per Threads profile / 24 小时滚动）

| 操作 | 上限 |
| --- | --- |
| API 发布帖子 | 250 |
| 回复 | 1000 |
| 删除 | 100 |
| Location search | 500 |

**关键**：这些限制是**每个 Threads 用户独立计算**，不是 per app。一个 thread chain 发 N 段会占用 N 个发布配额（carousel 计为 1 条，但本 skill v1 不支持 carousel）。

**配额检查逻辑（由 `publisher.ts` 实现）**：
- Publish 开始前先调 `getPublishingLimits()`
- 如果 `quota_posts_remaining < segments.length`，直接拒绝并报 reset 时间
- 如果发布后剩余 <20 条，在 `PublishResult.quotaWarning` 里提示用户
- 回复模式使用 `quota_replies_remaining` 做同样检查

## Markdown 处理

Threads UI 是纯文本，不渲染 markdown。`cleanText()` 会在必要时剥掉：

- `# H1/H2/...` 标题标记
- `**bold**` / `*italic*` / `__under__`
- `` `code` `` 和 ``` fenced blocks ```
- `[text](url)` → `text (url)`
- `![alt](url)` → `alt`
- `>` 引用标记
- `---` 分隔线
- `-` / `*` / `1.` 列表符号
- HTML 标签

多段空行会被合并到最多 2 个。

## Hashtag 策略（由 profile 决定）

### `strategy: none`
不加 hashtag。最"干净"的写法。

### `strategy: trailing`
```
<正文>

#tag1 #tag2
```

所有 hashtag 集中在最后一段末尾（**空行分隔**）。

### `strategy: inline`
```
<正文 ... 最后一句> #tag1

#tag2 #tag3
```

第一个 hashtag 嵌入最后一句尾部（空格分隔），其余 tag trailing。

## 字符计数细节

- URL 按**实际字符数**算（Threads 不像 X 把 URL 统一计为 23 字符）
- 中文字符算 1 个字符
- 大部分 emoji 算 2 个（surrogate pair）
- Zero-width joiner 和 skin-tone modifier 会多算几个——尽量避免堆叠 emoji

## 校验流程

1. Agent 写每段时使用 `cleanText()` 做基础清理（如果输入是 markdown）
2. Agent 调 `validateSegment(text)` 检查每段 —— CLI 的 `preview` 和 `publish` 会再次校验
3. 如果 `validateSegment` 返回 `ok: false`，agent 重写那一段（最多 2 次）
4. 媒体 URL 在传给 `createContainer` 之前，用 `validateImageUrl` / `validateVideoUrl` 做 HEAD 检查
