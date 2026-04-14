# YouMind Ghost Skill

AI 驱动的 Ghost 文章写作与发布 Skill。告诉 Agent 一个主题，它就能完成调研、写作、Markdown 转 HTML、上传图片，并通过你已经在 YouMind 里连接好的 Ghost 账号发文。

---

## 它能做什么

| 你说 | Skill 会做 |
|------|------------|
| `写一篇关于 AI Agent 的 Ghost 文章` | 调研 -> 写作 -> 适配 -> 发布草稿 |
| `把这篇 Markdown 发到 Ghost` | 跳过写作，直接转换并发布 |
| `检查我的 Ghost 配置` | 检查 YouMind API Key、付费权限和 Ghost 连通性 |
| `列出我的 Ghost 草稿` | 通过 YouMind 拉取 Ghost 草稿列表 |

---

## 配置

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 生成配置文件（如果 config.yaml 不存在）
cp config.example.yaml config.yaml
```

`config.yaml` 现在只需要配置 YouMind API Key：

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

命令会统一从本地 `config.yaml` 读取 `youmind.api_key` 和 `youmind.base_url`。
文档里的域名固定写 `https://youmind.com/openapi/v1`。如果你要联调本地 `youapi`，只改你本地的 `config.yaml`，不要改文档或命令示例。

### 发布前提

发布前，请先在 YouMind 里连接你的 Ghost 账号。这个 skill 不再读取本地的 `ghost.site_url` 或 `ghost.admin_api_key`，也不应该再要求用户把 Ghost Admin 凭证粘贴到这个仓库里。

### 获取 YouMind API Key

打开 [YouMind API Key 设置页](https://youmind.com/settings/api-keys?utm_source=youmind-ghost-article)，创建一个 key，然后填到 `youmind.api_key`。

---

## 使用建议

### CLI 命令

本地 Markdown 源文件建议统一放在 skill 的 `output/` 目录下，这样不会进入 git 提交列表。

```bash
cd toolkit

# 以草稿发布 Markdown
npx tsx src/cli.ts publish ../output/article.md --draft

# 直接发布
npx tsx src/cli.ts publish ../output/article.md --publish

# 本地预览 HTML
npx tsx src/cli.ts preview ../output/article.md

# 校验 YouMind + Ghost 连通性
npx tsx src/cli.ts validate

# 列出文章
npx tsx src/cli.ts list --page 1 --limit 10

# 只列草稿
npx tsx src/cli.ts list-drafts --page 1 --limit 10

# 只列已发布文章
npx tsx src/cli.ts list-published --page 1 --limit 10

# 查询单篇文章
npx tsx src/cli.ts get-post 69de04770c17b300017b5650

# 按 ID 发布已有草稿
npx tsx src/cli.ts publish-post 69de04770c17b300017b5650

# 按 ID 撤回成草稿
npx tsx src/cli.ts unpublish-post 69de04770c17b300017b5650
```

### 草稿工作流

这个 skill 默认发草稿。对于草稿和定时文章，CLI 会把 Ghost Admin 链接直接打印出来，方便用户立刻去后台检查。如果用户想直接公开发布，用 `--publish` 或 `publish-post <id>`。

本地 preview 文件现在默认写到 skill 的 `output/` 目录，这个目录已经在 `.gitignore` 里，生成的文章和预览文件不会污染仓库。

### 付费计划要求

Ghost OpenAPI 现在要求 YouMind 付费计划（`Pro` / `Max`）。如果当前账号没有权限，API 会返回 `402`，并提示前往 [YouMind Pricing](https://youmind.com/pricing) 升级。

---

## 常见问题

**Q: 我遇到 401 / 鉴权错误**

检查 `config.yaml` 里的 `youmind.api_key`。这个 skill 现在只通过 YouMind 鉴权。

**Q: 发布时提示 Ghost 没有连接**

先去 YouMind 里连接 Ghost。Ghost 的站点地址和 Admin API Key 现在保存在 YouMind，不在本地 `config.yaml`。

**Q: 不连接 Ghost 还能本地预览吗？**

可以。`preview` 只依赖本地 Markdown 转 HTML，不依赖 Ghost。

**Q: 能不能显式发布 / 撤回文章？**

可以。CLI 和 YouMind Ghost OpenAPI 现在都支持 `publish-post`、`unpublish-post`、`list-drafts`、`list-published`。

**Q: 特色图片怎么处理？**

如果你传的是本地图片，skill 会先通过 YouMind Ghost OpenAPI 上传到 Ghost，再创建或更新文章。

---

## 许可证

MIT
