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

本 Skill 支持两种认证方式，自动检测：

| 模式 | 需要什么 | 是否需要 API 审批 | 推荐场景 |
| ---- | -------- | ----------------- | -------- |
| **Cookie 模式** | 用户名 + 密码 | 不需要 | 快速上手，无需等待 |
| **OAuth 模式** | 用户名 + 密码 + client_id + client_secret | 需要（约 7 天） | 已有 API 凭证 |

### Cookie 模式（推荐，无需审批）

只需要你的 Reddit 用户名和密码，**不需要申请 API 访问**。

将以下内容填入 `config.yaml`：

```yaml
reddit:
  client_id: ""
  client_secret: ""
  username: "你的 Reddit 用户名"
  password: "你的 Reddit 密码"
  user_agent: "youmind-reddit/1.0 by /u/yourname"
```

`client_id` 和 `client_secret` 留空即可，Skill 会自动使用 Cookie 模式登录。

### OAuth 模式（已有 API 凭证）

如果你已经有 Reddit API 凭证（2025 年 11 月前创建的，或已通过审批），可以使用 OAuth 模式获得更稳定的体验。

<details>
<summary>展开 OAuth 设置步骤</summary>

> **注意（2025 年 11 月起）：** Reddit 已取消自助创建 API 应用，需先提交申请并通过人工审核。详见 [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)。

1. 访问 [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)，按提示提交开发者申请
2. 审核通过后，创建 **script** 类型应用（redirect uri 填 `http://localhost:8080`）
3. 复制 **Client ID**（应用名下方短字符串）和 **Client Secret**
4. 填入 `config.yaml`：

```yaml
reddit:
  client_id: "你的 Client ID"
  client_secret: "你的 Client Secret"
  username: "你的 Reddit 用户名"
  password: "你的 Reddit 密码"
  user_agent: "youmind-reddit/1.0 by /u/yourname"
```

</details>

### 注意事项

- 两种模式都只能以你自己的身份发帖。
- `user_agent` 建议包含你的用户名，避免被 Reddit 限速。
- Cookie 模式依赖 Reddit 旧版登录接口，如果 Reddit 关闭该接口，需切换到 OAuth 模式。

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
| `reddit.client_id` | 可选 | Reddit 应用 client ID（留空则使用 Cookie 模式） |
| `reddit.client_secret` | 可选 | Reddit 应用 client secret（留空则使用 Cookie 模式） |
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

**无法在 reddit.com/prefs/apps 创建应用** — 推荐使用 Cookie 模式（不需要 API 凭证）。把 `client_id` 和 `client_secret` 留空，只填用户名和密码即可。如果确实需要 OAuth，需先提交开发者申请并等待审核（约 7 天），详见 [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)。

**发布报 403 错误** — Cookie 模式下，检查用户名和密码是否正确。OAuth 模式下，同时检查 `client_id` 和 `client_secret`。

**被限速** — Reddit 对新账号和低 karma 账号有发帖限制。确保 `user_agent` 包含你的用户名。

**帖子被自动删除** — 某些子版块有 AutoModerator 规则。检查子版块的发帖要求（karma 门槛、账号年龄等）。

**script 类型有什么限制** — script 类型只能以你自己的身份操作，无法代表其他用户发帖。

---

## 许可证

MIT
