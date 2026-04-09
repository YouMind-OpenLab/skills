# Threads Publishing Pipeline

## 概览

```
解析请求 -> 加载 profile -> 研究 -> 写作+分段 -> 预览 -> 发布 -> 沉淀 -> 汇报
```

## 步骤详解

| # | 名称 | 动作 | 降级策略 |
| --- | --- | --- | --- |
| 1 | 解析请求 | 判断是 topic / raw-file / reply，选择 profile | — |
| 2 | 加载 profile | 读 `profiles/{name}/voice.yaml` 和 `lessons.md` | profile 缺失时触发 onboarding（见下） |
| 3 | 研究 | `youmind.mineTopics` + `youmind.webSearch` | 出错则跳过，仅凭 topic 写作 |
| 4 | 写作 + 拆分 | Agent 读 `writing-guide.md`、`chain-splitting.md`、profile voice、lessons、研究素材 → 写 `output/<slug>.md` 和字节一致的 `output/<slug>.md.agent` 快照 | 无效段最多重写 2 次；>12 段时警告 |
| 5 | 预览 | 在终端显示分段结果（`cli.ts preview`） | — |
| 6 | 发布 | `cli.ts publish <file>`：CLI 自动做 binding check、quota check、chain loop、partial failure 处理 | 见错误处理 |
| 7 | 沉淀 | Append `history.yaml`（由 `publisher.ts` 自动完成）；若草稿被编辑过，agent 对比 `<slug>.md` vs `<slug>.md.agent` 并 append `lessons.md`；可选 `youmind.saveArticle` 归档 | best-effort，失败只 log warn |
| 8 | 汇报 | 展示首条 permalink、总段数、profile 名、配额警告（如有） | — |

## Step 4 写作详解（重要）

Agent 写作时必须同时产出两份文件：

1. `output/<slug>.md` —— 用户可编辑的工作副本，后续会被 `publish` 读取
2. `output/<slug>.md.agent` —— agent 原始输出的**冻结快照**，永不修改

这两份文件在写入时必须字节一致。快照用于 Step 7 的 lessons diff。两份都在 git-ignored 的 `output/` 目录下。

Slug 规则：kebab-case，描述性（例如 `ai-coding-tools-thread.md`），不要用时间戳。

## Profile Onboarding（首次使用）

当 `profiles/default/voice.yaml` 不存在、用户又触发 `publish` 或 `preview` 时：

1. **优先使用 `AskUserQuestion` 工具**（如果 host 支持）提三个结构化问题：
   - 整体**语气**（例如 "技术同行聊天，有梗但不刻意" / "专业严谨，偏企业语气" / "朋友聊天，轻松随性"）
   - 线程**长度偏好**：`short`（3-5 段）/ `medium`（6-10 段）/ `long`（11+ 段）
   - **Hashtag 策略**：`inline`（穿插进正文）/ `trailing`（末尾集中）/ `none`（不用）
2. 若 `AskUserQuestion` 不可用，降级为纯文本多选（打印编号选项，让用户用字母回答）
3. 拿到答案后**直接调用** CLI 写入 profile：

   ```bash
   npx tsx src/cli.ts profile create \
     --name default \
     --tone "<用户回答的语气描述>" \
     --length short|medium|long \
     --hashtags inline|trailing|none
   ```

4. 继续执行用户原本的 `publish` / `preview` 请求

## 路由快捷键

| 用户输入 | 入口 |
| --- | --- |
| 只有 topic | Step 2（完整流程） |
| `output/*.md` 文件路径 | Step 5（跳过写作） |
| `reply <parent_id> "<text>"` | Step 4 简化版 + Step 6 带 `replyToExisting` |
| `preview <input>` | Step 4 + Step 5，不进 Step 6 |
| `validate` / `list` / `profile *` | 直接调 `cli.ts` 对应命令 |

## Step 7 Lessons Diff 详解

发布成功后，agent（同一对话内，无需额外 API 调用）：

1. 读 `output/<slug>.md`（用户最终版本）
2. 读 `output/<slug>.md.agent`（agent 原始快照）
3. 如果两份文件字节一致 → 跳过 diff，什么也不做
4. 如果有差异 → 对比分析，总结 2-3 条规律（例如 "用户删掉了所有段开头的'说实话'"），以 markdown 形式 append 到 `profiles/<name>/lessons.md`

Lessons 的格式按日期分组：

```markdown
## 2026-04-09

- 用户删除了所有段落开头的"说实话"、"讲真"这类口水词 → 下次避免使用
- 用户把"5 个工具"改成"5 款工具" → 偏好用"款"而非"个"作工具量词
- 用户把第 2 段和第 3 段合并成更短的一段 → hook 需要更快收束
```

下次 agent 为这个 profile 写作时，会同时读取 `voice.yaml` 和 `lessons.md`，并把 lessons 当作**硬约束**。

## 错误处理速查

| 步骤 | 失败场景 | 处理 |
| --- | --- | --- |
| 2 | `voice.yaml` 缺失 | 触发 onboarding（非错误） |
| 3 | YouMind research 出错 | log warn，继续 |
| 4 | 某段 >500 字符 | Agent 重写该段（最多 2 次）；仍失败硬截断并警告 |
| 4 | >12 段 | 警告，询问用户是否压缩 |
| 4 | 图片/视频不符合 Meta 规格 | `validateImageUrl`/`validateVideoUrl` 在发布前报错 |
| 6 | `bound: false` | **非错误**：CLI 返回 upsell 文案，草稿已保存 |
| 6 | `createContainer` 首段失败 | CLI 报错退出，草稿保留 |
| 6 | `createContainer` 中段失败 | CLI 保存剩余段到 `<slug>-remaining.md`，提示 `publish <remaining-path> --reply-to <last-published-id>` 续发 |
| 6 | `publishContainer` 失败 | CLI 打印 `container_id`，提示用隐藏命令 `publish-container <id>` 重试 |
| 6 | 配额耗尽 | CLI 读 `getPublishingLimits` 报告 reset 时间；草稿保留 |
| 6 | Token 剩余 <7 天 | 发布成功后提示警告 |
| 7 | `history.yaml` / lessons 写入失败 | log warn，不影响发布 |
