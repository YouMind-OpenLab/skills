# YouMind Qiita 技能

AI 驱动的 Qiita 文章写作与发布。告诉 Agent 一个主题，它会通过你在 YouMind 中已连接的 Qiita 账号完成调研、写作、排版和发布。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `写一篇关于 Docker 最佳实践的 Qiita 文章` | 调研 → 写作 → 适配 → 发布为限定共享 |
| `把这篇 Markdown 发布到 Qiita` | 跳过写作，直接格式化并发布 |
| `帮我检查这篇文章是否符合 Qiita 规范` | 检查标签、代码块、结构 |
| `列出我的 Qiita 文章` | 通过 YouMind 获取你的 Qiita 文章 |

---

## 安装

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 创建配置文件（如果 config.yaml 不存在）
cp config.example.yaml config.yaml
```

`config.yaml` 只需要填 YouMind API Key：

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

命令会从本地 `config.yaml` 读取 `youmind.api_key` 和 `youmind.base_url`。
文档和示例里一律保持 `https://youmind.com/openapi/v1`。如需本地联调 `youapi`，只在你本地的 `config.yaml` 里覆盖。

### 发布前的准备

发布前，先在 YouMind 内连接你的 Qiita 账号。本技能不再从本地读取 `qiita.access_token`，也不应要求用户把 Qiita 令牌贴进本仓库。

### 获取 YouMind API Key

访问 [YouMind API Key 设置页](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article) 生成 Key，填入 `youmind.api_key`。

---

## YouMind 集成

Qiita 技能可接入 [YouMind](https://youmind.com) 知识库，获得更强大的内容创作能力。

### 知识库语义搜索

搜索你 YouMind 中收藏的文章、笔记、书签作为写作素材。AI 会根据语义匹配最相关的内容。

### 联网搜索

搜索互联网获取实时信息和热门话题。写文章时自动引用最新数据和趋势。

### 文章归档

发布后，自动将文章保存回你的 YouMind 知识库，方便日后引用和二次创作。

### 素材挖掘

浏览 YouMind 中的看板和文档，提取相关素材用于内容创作。

### 获取 API Key

访问 [YouMind API Key 设置页](https://youmind.com/settings/api-keys) 获取你的 API Key，填入 `config.yaml` 的 `youmind.api_key` 字段。

---

## 使用技巧

### Qiita 内容指南

- **环境信息**：务必包含版本号、操作系统、工具——Qiita 读者期望可复现的示例
- **代码块**：必须指定语言（如 ` ```python `），可用 ` ```python:main.py ` 显示文件名
- **标签**：最多 5 个，自由填写（如 `Python`、`Docker`、`TypeScript`、`初心者`）
- **标题**：具体、技术名称在前（如 `TypeScript で CLI ツールを作る`）
- **语气**：知识分享、技术性、同行交流
- **语言**：跟随用户的输入语言（日语或英语）

### CLI 命令

本地 Markdown 草稿请放在 skill 的 `output/` 目录下，避免污染 git status。

```bash
cd toolkit

# 发布 Markdown 文件
npx tsx src/cli.ts publish ../output/article.md --tags "Python,API,Qiita"

# 本地预览和验证
npx tsx src/cli.ts preview ../output/article.md

# 验证 YouMind + Qiita 连通性
npx tsx src/cli.ts validate

# 列出你的文章
npx tsx src/cli.ts list --page 1
```

### 发布状态

默认以限定共享（private）模式发布。使用 `--public` 公开发布，或在 Qiita 控制台中更改可见性。

所有本地草稿都应写入 `output/` 目录，该目录已经在 `.gitignore` 中。

### 付费计划要求

Qiita OpenAPI 需要付费 YouMind 计划（Pro / Max）。如当前账号不符合，API 会返回 `402`，并附带 [YouMind Pricing](https://youmind.com/pricing) 链接提示升级。

---

## 常见问题

**Q: 遇到 401 或鉴权错误**

检查 `config.yaml` 中的 `youmind.api_key`。本技能现在只与 YouMind 鉴权。

**Q: 发布提示 Qiita 未连接**

先在 YouMind 里连接 Qiita 账号。Qiita 令牌保存在 YouMind 服务端，不在 `config.yaml` 里。

**Q: 标签不生效**

Qiita 标签是自由格式，任何名称都可以。注意标签区分大小写（`Python` ≠ `python`）。使用已有的热门标签可以提高发现率。

**Q: 应该用日语还是英语写？**

Qiita 上大部分内容是日语。英语文章也可以，但受众较小。技能会跟随你的提示语言。

**Q: 什么是限定共享模式？**

限定共享的文章只能通过直链访问，不会出现在搜索结果和信息流中。适合用作草稿或团队分享。

**Q: 可以更新已发布的文章吗？**

可以。YouMind Qiita OpenAPI 支持创建、读取、更新、列表等操作。

---

## 许可证

MIT
