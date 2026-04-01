# YouMind Reddit Skill

Reddit AI 发布 Skill。对 Agent 说一句话，自动完成调研、写作、适配子版块风格、发布帖子。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `在 r/programming 发一篇关于 CLI 工具的帖子` | 调研、写作、适配风格、发布自帖 |
| `把这个链接提交到 r/technology` | 创建链接帖并附评论 |
| `在 r/AskReddit 发一个问题：你最好的编程技巧是什么？` | 撰写符合版块风格的提问 |
| `在 r/China_irl 发一篇关于远程办公的帖子` | 调研 → 适配子版块风格 → 发布 |

---

## 获取凭证

### 第 1 步 — 访问 Reddit Apps 页面

打开 [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)，登录你的 Reddit 账号。

### 第 2 步 — 创建应用

滚动到页面底部，点击 **"create another app..."** 按钮。

### 第 3 步 — 填写应用信息

填写以下信息：

- **name**: `youmind-publisher`（或任意名称）
- **type**: 选择 **script**
- **description**: 可选
- **about url**: 可留空
- **redirect uri**: `http://localhost:8080`

### 第 4 步 — 创建并复制凭证

点击 **"create app"** 按钮，然后复制以下凭证：

- **Client ID**: 应用名称正下方的短字符串
- **Client Secret**: 标记为 "secret" 的字段

### 第 5 步 — 填入配置文件

将凭证填入 `config.yaml`：

```yaml
reddit:
  client_id: "你的 Client ID"
  client_secret: "你的 Client Secret"
  username: "你的 Reddit 用户名"
  password: "你的 Reddit 密码"
  user_agent: "youmind-reddit/1.0 by /u/yourname"
```

### 注意事项

- **script** 类型的应用只能以你自己的身份发帖。
- `user_agent` 建议包含你的用户名，避免被 Reddit 限速。

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
| `reddit.client_id` | **是** | Reddit 应用 client ID |
| `reddit.client_secret` | **是** | Reddit 应用 client secret |
| `reddit.username` | **是** | 你的 Reddit 用户名 |
| `reddit.password` | **是** | 你的 Reddit 密码 |
| `reddit.user_agent` | **是** | User agent 字符串，如 `youmind-reddit/1.0 by /u/yourname` |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 → [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-reddit-article) |

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

### 适配子版块风格

Skill 会自动检查目标子版块的规则和风格，调整帖子格式和语气。

### 帖子类型

- **Self-post（文字帖）**: 直接撰写长文内容
- **Link post（链接帖）**: 分享链接并附评论

### CLI 命令

```bash
# 提交文字帖
npx tsx src/cli.ts submit --subreddit programming --title "My Title" --file article.md

# 提交链接帖
npx tsx src/cli.ts submit-link --subreddit technology --title "Interesting Article" --url https://example.com

# 预览适配后的内容
npx tsx src/cli.ts preview --file article.md

# 查看子版块规则
npx tsx src/cli.ts subreddit-info --sub programming

# 查看可用 flair
npx tsx src/cli.ts flairs --sub programming

# 查看个人资料
npx tsx src/cli.ts me
```

---

## 常见问题

**发布报 403 错误** — 检查 `client_id` 和 `client_secret` 是否正确，以及账号密码是否匹配。

**被限速** — Reddit 对新账号和低 karma 账号有发帖限制。确保 `user_agent` 包含你的用户名。

**帖子被自动删除** — 某些子版块有 AutoModerator 规则。检查子版块的发帖要求（karma 门槛、账号年龄等）。

**script 类型有什么限制** — script 类型只能以你自己的身份操作，无法代表其他用户发帖。

---

## 许可证

MIT
