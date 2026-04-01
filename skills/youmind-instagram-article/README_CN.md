# YouMind Instagram Skill

Instagram AI 发布 Skill。对 Agent 说一句话，自动完成调研、写作、生成视觉内容、优化标签、发布到 Instagram。

**重要：Instagram 每个帖子必须包含图片，不支持纯文本发布。**

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发一篇关于 AI 编程工具的 Instagram 帖子` | 调研 → 写文案 → 优化标签 → 配图 → 发布 |
| `创建一组关于 Docker 技巧的轮播图` | 写作 → 拆分为轮播图 → 发布 |
| `预览一段关于远程办公的文案` | 生成带标签的优化文案 |

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
| `instagram.business_account_id` | **是** | Instagram Business Account ID |
| `instagram.access_token` | **是** | 带 `instagram_basic` + `instagram_content_publish` 权限的 Access Token |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 → [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-instagram-article) |

---

## 获取凭证

### 前提条件

- **Instagram Business 或 Creator 账号**（个人账号不支持 API）
- 该 Instagram 账号已**关联到 Facebook Page**

### 第 1 步 — 访问 Facebook Developer Portal

打开 [Facebook Developer Portal](https://developers.facebook.com/)，登录你的 Facebook 账号。

### 第 2 步 — 创建应用

点击 **"Create App"**，类型选择 **Business**。

### 第 3 步 — 添加 Instagram Graph API 产品

在应用面板（App Dashboard）中，找到并添加 **"Instagram Graph API"** 产品。

### 第 4 步 — 获取 Access Token

1. 进入 [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. 在右上角的应用下拉菜单中，选择你刚创建的应用

3. 点击 **"Get User Access Token"**，在权限列表中勾选：
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`

4. 点击 **"Generate Access Token"**，完成授权流程

### 第 5 步 — 获取 Instagram Business Account ID

在 Graph API Explorer 中执行以下请求：

```
GET /me/accounts?fields=instagram_business_account
```

从返回结果中复制 `instagram_business_account.id`。

### 第 6 步 — 填入配置文件

将凭证填入 `config.yaml`：

```yaml
instagram:
  business_account_id: "你的 Instagram Business Account ID"
  access_token: "你的 Access Token"
```

### 注意事项

- **仅支持 Business/Creator 账号** — 个人账号无法使用 Instagram Graph API。
- **每个帖子必须包含图片** — Instagram 不支持纯文本发布。
- **Token 有效期 60 天** — 需定期刷新。回到第 4 步重新生成即可。

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

### Instagram 两步发布流程

Instagram API 使用两步发布流程，Skill 会自动处理：

1. **创建容器**: 上传图片和文案，创建媒体容器
2. **等待处理**: 等待 Instagram 处理媒体（状态变为 `FINISHED`）
3. **发布**: 发布处理完成的容器

轮播图（Carousel）会先上传每张图片作为子容器，然后组合成轮播容器再发布。

### CLI 命令

```bash
cd toolkit

# 验证凭证
npx tsx src/cli.ts validate

# 发布单图帖
npx tsx src/cli.ts publish "Your caption here" --image-url https://example.com/photo.jpg

# 发布轮播图
npx tsx src/cli.ts carousel "Carousel caption" --images https://img1.jpg https://img2.jpg https://img3.jpg

# 预览文案
npx tsx src/cli.ts preview "Your draft caption"

# 查看最近发布
npx tsx src/cli.ts list

# 检查容器处理状态
npx tsx src/cli.ts status <container_id>
```

---

## 常见问题

**报 "Instagram account not found" 错误** — 确认 Instagram 账号是 Business/Creator 类型，并且已关联到 Facebook Page。

**Token 过期报错** — Access Token 有效期 60 天。回到「获取凭证」第 4 步重新生成。

**发布失败报 "Image URL not reachable"** — Instagram 需要图片 URL 可公开访问。确保图片地址不需要登录即可访问。

**个人账号能用吗** — 不能。Instagram Graph API 仅支持 Business 和 Creator 账号。请先在 Instagram 设置中切换账号类型。

**轮播图最多几张** — Instagram 轮播图最多支持 10 张图片。

---

## 许可证

MIT
