# YouMind X (Twitter) Skill

X (Twitter) AI 发布 Skill。对 Agent 说一句话，自动完成调研、写作、发布推文或推文串。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发一条关于 AI 编程的推文` | 写作 → 适配 280 字符 → 发布推文 |
| `写一个关于 Docker 最佳实践的推文串` | 写作 → 拆分为推文串 → 逐条发布 |
| `直接发这条: "刚刚上线了!"` | 格式化并直接发布 |

---

## 获取凭证

### 第 1 步 — 访问 X Developer Portal

打开 [X Developer Portal](https://developer.x.com/en/portal/dashboard)，登录你的 X 账号。

### 第 2 步 — 创建 Project 和 App

在 Dashboard 中创建一个新的 **Project**，然后在 Project 下创建一个 **App**。

### 第 3 步 — 配置 User Authentication Settings

在 App 设置中，找到 **User authentication settings** 并配置：

- **App permissions**: Read and Write
- **Type of App**: Web App
- **Redirect URL**: `http://localhost:3000/callback`

### 第 4 步 — 获取凭证

有两种方式获取凭证：

**方式 A: OAuth 2.0（推荐）**

1. 在 App 的 **Keys and Tokens** 页面生成 Access Token
2. 填入 `config.yaml` 的 `x.access_token`

**方式 B: OAuth 1.0a（传统方式）**

1. 获取 API Key + API Secret → 填入 `x.api_key`, `x.api_secret`
2. 生成 Access Token + Secret → 填入 `x.access_token_legacy`, `x.access_token_secret`

### API 限额

- **Free tier**: 每月 1,500 条推文
- **Basic ($100/月)**: 每月 3,000 条推文

---

## 安装

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 生成配置文件
cp config.example.yaml config.yaml
```

`config.yaml` 需要填写以下凭证：

| 字段 | 必填 | 说明 |
|------|------|------|
| `x.access_token` | **是*** | OAuth 2.0 user access token |
| `x.api_key` | 替代* | OAuth 1.0a consumer key |
| `x.api_secret` | 替代* | OAuth 1.0a consumer secret |
| `x.access_token_legacy` | 替代* | OAuth 1.0a access token |
| `x.access_token_secret` | 替代* | OAuth 1.0a access token secret |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 → [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-x-article) |

*需要 OAuth 2.0 access_token 或全部四个 OAuth 1.0a 字段。

---

## YouMind 集成

本 Skill 深度集成 [YouMind](https://youmind.com) 知识库，提升内容质量和效率。

| 功能 | 说明 |
|------|------|
| 知识库语义搜索 | 从你的 YouMind 资料库中搜索相关文章、笔记、书签作为写作素材 |
| 联网搜索 | 搜索互联网获取实时信息和热门话题 |
| 文章归档 | 发布后自动将文章保存回 YouMind 知识库，便于未来引用 |
| 素材挖掘 | 浏览 Board、提取相关素材用于内容创作 |
| Board 管理 | 列出、查看你的 YouMind Board 和素材 |

> **获取 YouMind API Key：** [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch)

---

## 使用技巧

### 单条推文

直接说你想发什么，Skill 会自动适配 280 字符限制，调整语气和格式。

### 推文串

提供一个较长的主题，Skill 会自动拆分成多条推文，保持逻辑连贯并逐条发布。

### CLI 命令

```bash
# 发布单条推文
npx tsx src/cli.ts tweet --text "Your tweet here"

# 从文件发布推文串
npx tsx src/cli.ts thread --file article.md

# 预览推文串拆分
npx tsx src/cli.ts preview --file article.md

# 查看个人资料
npx tsx src/cli.ts me

# 删除推文
npx tsx src/cli.ts delete --id 1234567890
```

---

## 常见问题

**发布失败报 403 错误** — 检查 App permissions 是否设置为 "Read and Write"。

**OAuth Token 过期** — 重新生成 Access Token 并更新 `config.yaml`。

**推文被截断** — Skill 会自动控制在 280 字符内，如果内容过长会建议拆成推文串。

**Free tier 额度用完** — Free tier 每月 1,500 条。升级到 Basic ($100/月) 可获得 3,000 条/月。

---

## 许可证

MIT
