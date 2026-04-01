# YouMind Facebook Skill

Facebook 主页 AI 发布 Skill。对 Agent 说一句话，自动完成调研、写作、适配 Facebook 风格、发布到你的主页。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发一篇关于 AI 趋势的 Facebook 帖子` | 调研 → 写作 → 适配风格 → 发布 |
| `分享这个链接并附上评论` | 创建链接帖并附优化评论 |
| `发一篇关于远程办公趋势的 Facebook 帖子` | 调研 → 写作 → 适配 Facebook 风格 → 发布到主页 |
| `发一篇带图片的产品发布帖子` | 创建图文帖子 |

---

## 获取凭证

### 第 1 步 — 访问 Facebook Developer Portal

打开 [Facebook Developer Portal](https://developers.facebook.com/)，登录你的 Facebook 账号。

### 第 2 步 — 创建应用

点击 **"Create App"**，类型选择 **Business**。

### 第 3 步 — 添加 Facebook Login 产品

在应用面板（App Dashboard）中，找到并添加 **"Facebook Login"** 产品。

### 第 4 步 — 获取 Page Access Token

1. 进入 [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. 在右上角的应用下拉菜单中，选择你刚创建的应用

3. 点击 **"Get User Access Token"**，在权限列表中勾选：
   - `pages_manage_posts`
   - `pages_read_engagement`

4. 点击 **"Generate Access Token"**，完成授权流程

5. 在 User or Page 下拉菜单中，选择你的 **Page** → 获取 Page Access Token

### 第 5 步 — 延长 Token 有效期（推荐）

默认 Token 有效期很短。延长步骤：

1. 进入 [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

2. 粘贴你的 Page Access Token，点击 **"Debug"**

3. 点击底部的 **"Extend Access Token"**（有效期延长到 60 天）

### 第 6 步 — 填入配置文件

将凭证填入 `config.yaml`：

```yaml
facebook:
  page_id: "你的 Facebook Page ID"
  page_access_token: "延长后的 Page Access Token"
```

### 注意事项

- Token 有效期最长 **60 天**，过期后需重新获取。
- Page ID 可以在你的 Facebook Page → "About" / "关于" → "Page ID" 中找到。

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
| `facebook.page_id` | **是** | 你的 Facebook Page ID |
| `facebook.page_access_token` | **是** | 延长后的 Page Access Token |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 → [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-facebook-article) |

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

### 帖子类型

- **文字帖**: 纯文本内容，适合观点输出
- **链接帖**: 分享链接并附评论
- **图文帖**: 带图片的帖子，提升互动率

### CLI 命令

```bash
cd toolkit

# 验证凭证
npx tsx src/cli.ts validate

# 发布文字帖
npx tsx src/cli.ts publish "Your post content here"

# 发布链接帖
npx tsx src/cli.ts publish "Check out this article" --link https://example.com

# 发布图文帖
npx tsx src/cli.ts publish "Great photo!" --with-image https://example.com/photo.jpg

# 预览帖子
npx tsx src/cli.ts preview "Your draft post content"

# 查看最近帖子
npx tsx src/cli.ts list
```

---

## 常见问题

**Token 过期报错** — Page Access Token 最长有效 60 天。重新走「获取凭证」流程生成新 Token。

**发布报权限错误** — 确认 Token 包含 `pages_manage_posts` 权限，并且选择的是 Page Token 而非 User Token。

**找不到 Page ID** — 打开你的 Facebook Page → "About" / "关于" → 页面底部可以找到 Page ID。

**帖子没有互动** — Facebook 算法偏好原创长文和图文内容。尽量避免纯链接帖。

---

## 许可证

MIT
