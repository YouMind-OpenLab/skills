# YouMind Ghost Skill

Ghost AI 写作发布 Skill。对 Agent 说一句话，自动完成选题、写作、HTML 转换、发布到 Ghost 博客。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于 Web3 的 Ghost 文章` | 选题 -> 写作 -> Markdown->HTML -> 发布草稿 |
| `把这篇 Markdown 发到 Ghost` | 跳过写作，直接转换并发布 |
| `列出我最近的 Ghost 文章` | 获取并展示最近的文章列表 |
| `检查我的 Ghost 配置` | 检查 API 凭证和连接状态 |

---

## 获取凭证

### 获取 Ghost Admin API Key

> Ghost Admin 面板：`yourdomain.com/ghost`

**第 1 步 -- 登录 Ghost Admin 面板**

打开浏览器访问 `https://yourdomain.com/ghost`（或 `https://yourdomain.ghost.io/ghost`），使用管理员账号登录。

**第 2 步 -- 进入集成设置**

点击左下角齿轮图标进入 **Settings**（设置），然后找到 **Integrations**（集成）。

**第 3 步 -- 添加自定义集成**

点击 **"Add custom integration"**（添加自定义集成）按钮。

**第 4 步 -- 命名并创建**

输入集成名称（如 `YouMind Publisher`），然后点击 **Create**。

**第 5 步 -- 复制 Admin API Key**

在创建的集成详情页中，找到 **"Admin API Key"** 字段。复制该 Key，填入 `config.yaml` 的 `ghost.admin_api_key` 字段。

> **注意：**
> - Admin API Key 格式必须是 `id:secret`，冒号分隔
> - `id` 是 24 位十六进制字符串，`secret` 是 64 位十六进制字符串
> - API URL 显示在集成页面底部，确保与 `ghost.site_url` 一致

**第 6 步 -- 填写站点地址**

将你的 Ghost 站点地址填入 `config.yaml` 的 `ghost.site_url`（如 `https://myblog.ghost.io`）。

### 验证配置

```bash
cd toolkit && npx tsx src/cli.ts validate
```

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
| `ghost.site_url` | **是** | 你的 Ghost 站点地址（如 `https://myblog.ghost.io`） |
| `ghost.admin_api_key` | **是** | Admin API Key，格式为 `{id}:{secret}` |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 -> [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article) |

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
# 以草稿发布 Markdown 文件
npx tsx src/cli.ts publish article.md --draft

# 立即发布
npx tsx src/cli.ts publish article.md --publish

# 带标签发布
npx tsx src/cli.ts publish article.md --tags "AI,tech"

# 本地预览 HTML
npx tsx src/cli.ts preview article.md

# 列出最近文章
npx tsx src/cli.ts list --limit 10

# 验证凭证
npx tsx src/cli.ts validate
```

### Ghost 特色功能

- **Newsletter 友好内容** -- Ghost 文章同时作为 Newsletter 邮件发送。Skill 会优化内容，确保在网页和邮件客户端中都有良好渲染
- **标签系统** -- Ghost 使用扁平标签系统，列表中第一个标签为主标签（用于 URL 路由和模板选择），其余为辅助标签
- **特色图片** -- Ghost 支持每篇文章设置一张特色图片，展示在文章顶部和卡片预览中

---

## 常见问题

**发布报 401 错误** -- 检查 Admin API Key 是否正确，必须是 `{id}:{secret}` 格式，确保集成处于激活状态。

**JWT Token 错误** -- Skill 使用 Node.js crypto 模块生成 JWT Token，无需额外 JWT 库。Token 有效期 5 分钟，自动重新生成。

**图片上传失败** -- 确保 Ghost 实例允许图片上传，且文件大小在限制范围内（Ghost Pro 默认 5MB）。

**文章显示为草稿** -- 默认所有文章以草稿形式创建。使用 `--publish` 参数可直接发布。

**API Key 格式错误** -- Admin API Key 必须包含冒号分隔的 id 和 secret。如果复制时遗漏了冒号或只复制了一半，请回到 Ghost Admin -> Settings -> Integrations 重新复制完整 Key。

---

## 许可证

MIT
