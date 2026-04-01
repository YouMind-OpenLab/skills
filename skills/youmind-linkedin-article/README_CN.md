# YouMind LinkedIn Skill

LinkedIn AI 写作发布 Skill。对 Agent 说一句话，自动完成调研、写作、排版、发布到 LinkedIn。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于创业经验的 LinkedIn 文章` | 调研 → 写作 → 排版 → 发布到 LinkedIn |
| `把这段文字发到 LinkedIn: [文本]` | 跳过写作，直接排版并发布 |
| `写一篇公司主页动态，关于我们的产品发布` | 发布到公司主页 |
| `查看我的 LinkedIn 个人资料` | 查看个人资料和连接状态 |

---

## 获取凭证

### 获取 LinkedIn Access Token

> LinkedIn 开发者门户：<https://developer.linkedin.com/>

由于 LinkedIn 使用 OAuth 2.0 授权流程，获取 Access Token 相对复杂，请仔细按步骤操作。

**第 1 步 — 访问 LinkedIn Developer Portal**

打开 [LinkedIn Developer Portal](https://developer.linkedin.com/)，使用你的 LinkedIn 账号登录。

**第 2 步 — 创建应用**

点击 **"Create App"**，填写应用信息，并关联你的 LinkedIn Company Page（如果没有 Company Page，需要先创建一个）。

**第 3 步 — 申请产品权限**

进入应用的 *Product*s** 标签页，申请以下产品：

- **"Share on LinkedIn"** — 用于发布内容
- **"Sign In with LinkedIn using OpenID Connect"** — 用于身份验证

**第 4 步 — 获取 Client ID 和 Client Secret**

进入应用的 **Auth** 标签页，复制 **Client ID** 和 **Client Secret**。

**第 5 步 — 配置 Redirect URL**

在 Auth 标签页的 **"OAuth 2.0 settings"** 区域，添加一个 Redirect URL（如 `http://localhost:3000/callback`）。

**第 6 步 — 一键获取 Access Token 和 Person URN**

运行内置的 OAuth 辅助脚本，自动完成授权、换取 Token、获取 Person URN 并写入 `config.yaml`：

```bash
cd toolkit && node dist/oauth-helper.js --client-id {YOUR_CLIENT_ID} --client-secret {YOUR_CLIENT_SECRET}
```

脚本会自动：
1. 在本地启动一个临时服务器（`http://localhost:3000`）
2. 打开浏览器跳转到 LinkedIn 授权页面
3. 你登录并授权后，自动捕获 Authorization Code
4. 用 Code 换取 Access Token
5. 调用 LinkedIn API 获取你的 Person URN
6. 将所有凭证写入 `config.yaml`

完成后浏览器会显示 "Authorization Complete"，即可关闭页面。

> **注意：**
>
> - Access Token 有效期为 **60 天**，过期后重新运行此脚本即可续期
> - 需要先有 LinkedIn Company Page 才能创建应用
> - `w_member_social` scope 需要通过 "Share on LinkedIn" 产品审批

**可选：开启读取帖子权限**

默认的 "Share on LinkedIn" 产品仅支持发布帖子，不支持读取已发布的帖子（如查询 Post ID 和 URL）。如果需要读取帖子，需要额外申请 **Community Management API** 产品以获取 `r_member_social` 权限。

> **重要限制：** LinkedIn 要求 Community Management API 必须是应用中**唯一的产品**，不能与 "Share on LinkedIn" 等其他产品共存。因此你需要：
>
> 1. 在 [LinkedIn Developer Portal](https://developer.linkedin.com/) 创建一个**新的应用**
> 2. 仅申请 **Community Management API** 产品
> 3. 审批通过后，使用新应用的 Client ID 和 Client Secret 运行 OAuth 脚本，scope 需包含 `r_member_social`：
>
> ```bash
> cd toolkit && node dist/oauth-helper.js --client-id {NEW_CLIENT_ID} --client-secret {NEW_CLIENT_SECRET}
> ```
>
> 注意：`r_member_social` 是受限权限，LinkedIn 不一定对所有开发者开放。

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
| `linkedin.access_token` | **是** | OAuth 2.0 Access Token（有效期 60 天） |
| `linkedin.person_urn` | **是** | 你的 LinkedIn Person URN（格式 `urn:li:person:{id}`） |
| `linkedin.organization_urn` | 否 | 公司主页 URN，用于发布公司动态 |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网调研 → [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-linkedin-article) |

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

### CLI 命令

```bash
# 发布文本帖子
npx tsx src/cli.ts publish --text "Your post content" --visibility PUBLIC

# 本地预览排版内容
npx tsx src/cli.ts preview --file article.md

# 查看个人资料
npx tsx src/cli.ts profile

# 带图片发布
npx tsx src/cli.ts publish --text "Post with image" --image cover.png

# 验证凭证
npx tsx src/cli.ts validate
```

### LinkedIn 内容建议

- **个人帖子 vs 公司帖子** — 默认发布到个人资料，配置 `linkedin.organization_urn` 后可发布公司动态
- **可见性设置** — 支持 `PUBLIC`（所有人可见）和 `CONNECTIONS`（仅人脉可见）
- **图片和富媒体** — 支持在帖子中附加图片，提升互动率
- **最佳发布时间** — LinkedIn 的高互动时段通常是工作日早 8-10 点和中午 12-1 点

---

## 常见问题

**发布报 401/403 错误** — Access Token 可能已过期（60 天有效期）。重新执行 OAuth 流程获取新 Token。

**找不到 "Share on LinkedIn" 产品** — 确保你的应用已关联 LinkedIn Company Page。进入 Developer Portal → 你的应用 → Settings，检查 Company Page 关联状态。

**Person URN 获取失败** — 确保 Access Token 包含 `openid` 和 `profile` scope。使用 `validate` 命令测试 Token 是否有效。

**公司主页发布失败** — 确保你是该 Company Page 的管理员，且 `linkedin.organization_urn` 格式正确（`urn:li:organization:{id}`）。

**Access Token 过期太快** — LinkedIn 的标准 Access Token 有效期为 60 天，目前无法延长。建议设置日历提醒，在到期前重新授权。

---

## 许可证

MIT
