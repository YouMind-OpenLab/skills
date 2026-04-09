# youmind-threads-article

> AI 驱动的 Meta Threads 发布器，带 voice profile 沉淀和 YouMind 代理 OAuth。

用**你自己的语气**写 Threads 帖子和线程链。从 YouMind 知识库研究话题，由模型把长文按自然节奏拆成线程，一条命令发布——**不需要 Meta 开发者后台，也不需要手动刷新 token**。

## 为什么是这个 skill

大多数 Threads 发布工具都要求你：

1. 去 Meta 开发者后台
2. 注册一个 Meta app
3. 拿到 long-lived page access token
4. 每 60 天手动刷新
5. 每个 skill 都要重复一遍

这个 skill 用 **YouMind 作为 OAuth 代理**：你在 YouMind 的设置页面点一次 "Connect Threads"，所有需要 Threads 权限的 skill 都不用再碰 Meta token。

更上一层，skill 会**记住你的语气**：

- `profiles/<name>/voice.yaml` —— 语气、人设、长度偏好、hook 风格
- `profiles/<name>/history.yaml` —— 每次发布的 append-only 日志
- `profiles/<name>/lessons.md` —— agent 从你的编辑中学到的规律

用得越久，skill 越接近"你自己"的写法，而不是"某个通用 AI"的写法。

## 安装

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
```

在 `config.yaml` 里填 `youmind.api_key`。去 [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article) 申请一个。

然后在 [YouMind Integrations](https://youmind.com/settings/integrations?utm_source=youmind-threads-article) 点一次 "Connect Threads"。

验证：

```bash
cd toolkit && npx tsx src/cli.ts validate
```

## 使用

直接用自然语言跟 agent 讲就行：

- "写一条关于 2026 年 AI 编程工具的 Threads 线程"
- "把 `output/ai-thread.md` 发到 Threads"
- "预览一条关于远程办公的 Threads 帖子"
- "回复 Threads 帖子 18028... 说：这和我的经验完全一致"

Agent 会自动：

1. 首次使用时问你一次 voice profile（语气、长度、hashtag 策略）
2. 研究话题（YouMind 知识库 + 网页搜索）
3. 写草稿到 `output/<slug>.md`
4. 预览给你看
5. 发布——单条或多段线程链

## CLI 参考（如果你喜欢直接控制）

```bash
# 完整流程
npx tsx src/cli.ts publish output/my-thread.md

# 仅预览
npx tsx src/cli.ts preview output/my-thread.md

# 单条内联帖子
npx tsx src/cli.ts publish "刚刚发布了我的第一个开源项目。"

# 回复
npx tsx src/cli.ts reply 18028123 "完全同意"

# 账号 / 配额
npx tsx src/cli.ts validate
npx tsx src/cli.ts list --limit 5
npx tsx src/cli.ts limits

# Profile
npx tsx src/cli.ts profile list
npx tsx src/cli.ts profile show default
npx tsx src/cli.ts profile create --name work --tone "专业简洁" --length medium --hashtags trailing
```

所有 publish/preview 命令都支持 `--profile <name>` 切换不同 voice。

## 草稿格式

草稿放在 `output/<slug>.md`。单条帖子可以内联。线程链用 `## N` 作分段：

```markdown
---
profile: default
topic: "AI 编程工具现状"
segments: 4
---

## 1

大多数人对 AI 编程工具的失望，是从"它写的代码我还得改"开始的。

## 2

直到有一天我意识到：我期待的是一个实习生，但我真正需要的是敲键盘更快的我自己。

## 3

...
```

Agent 写的每份草稿都会同时保存一份冻结快照 `output/<slug>.md.agent`。发布成功后，agent 会对比两份文件，把差异总结成 2-3 条规律 append 到 `profiles/<name>/lessons.md`——这样下次写得更像你。

## 平台限制

Meta Threads 的硬约束（skill 都会遵守）：

| 项 | 限制 |
| --- | --- |
| 单条帖子字符数 | 500 |
| 单条 URL 数 | 5 |
| 24h 发布数 | 250（每个 Threads 用户） |
| 24h 回复数 | 1000（每个 Threads 用户） |
| 图片 | JPEG/PNG，≤8 MB，宽 320-1440 px |
| 视频 | MP4/MOV，≤1 GB，≤5 分钟，23-60 FPS |

N 段的线程链会占用 24h 配额中的 N 条发布数。

## v1 范围

v1 支持：文本 + 首段单图/单视频 + 一级回复链。v1 **不包含**：

- Carousel 轮播（2-20 图）—— v1.1
- 读取回复树 —— v1.1
- 互动数据回填（likes/reposts 计数）—— 未来
- 跨 profile 的 lesson 共享 —— 未来

> **注意**：YouMind `/threads/*` 代理端点目前在 `toolkit/src/threads-api.ts` 里是
> mock 实现，等 YouMind 服务端上线 Threads 命名空间后会切换成真实 HTTP。Mock
> 返回内存中的合理假数据，并支持通过环境变量注入失败场景
> （`THREADS_MOCK_UNBOUND`、`THREADS_MOCK_QUOTA_LOW`、`THREADS_MOCK_FAIL_AT`）。
> 真实端点上线后，替换只涉及 `threads-api.ts` 一个文件，其它模块不用动。

## 常见问题

**`Threads account not bound on YouMind yet`**
去 https://youmind.com/settings/integrations 点 "Connect Threads"，然后重新运行 publish。

**`Segment N invalid: Segment is 523 chars, max is 500`**
重写那一段让它更短，或者让 agent 再拆一下。

**`Threads post quota exhausted`**
Meta 的 24h 滚动窗口是慢慢恢复的。CLI 会显示下次 reset 时间。

**`Token expires in N days`**
去 YouMind 设置页重新授权，点一次就行。

## 贡献

完整设计文档在 `docs/superpowers/specs/2026-04-08-youmind-threads-article-design.md`。

## 链接

- [获取 YouMind API Key](https://youmind.com/settings/api-keys?utm_source=youmind-threads-article)
- [在 YouMind 上连接 Threads](https://youmind.com/settings/integrations?utm_source=youmind-threads-article)
- [更多 YouMind Skills](https://youmind.com/skills?utm_source=youmind-threads-article)
