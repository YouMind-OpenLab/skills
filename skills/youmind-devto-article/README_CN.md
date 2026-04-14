# YouMind Dev.to Skill

这是一个 Dev.to AI 写作发布 Skill。对 Agent 说一句话，它就可以调研、写作、排版，并通过你已经在 YouMind 中连接好的 Dev.to 账号发布。

---

## 能做什么

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于 Docker 最佳实践的 Dev.to 文章` | 调研 -> 写作 -> Dev.to 适配 -> 发布草稿 |
| `把这篇 Markdown 发到 Dev.to` | 跳过写作，直接排版发布 |
| `校验我的 Dev.to 文章` | 检查标签、front matter、代码块 |
| `列出我的 Dev.to 文章` | 通过 YouMind 拉取你的 Dev.to 文章 |

---

## 安装与配置

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 生成配置文件
cp config.example.yaml config.yaml
```

`config.yaml` 现在只需要 YouMind API Key：

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

也可以不写入文件，直接使用环境变量 `YOUMIND_API_KEY`。

### 发布前置条件

发布前，请先在 YouMind 产品内连接你的 Dev.to 账号。这个 skill 不再读取本地的 `devto.api_key`，也不应该再要求用户把 Dev.to token 填到这个仓库里。

### 获取 YouMind API Key

访问 [YouMind API Key 设置页](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article)，创建并填入 `youmind.api_key`。

---

## 使用技巧

### Dev.to 内容规范

- **TL;DR**：每篇文章开头最好有 TL;DR 摘要
- **代码块**：必须标注语言，例如 ` ```typescript `
- **标签**：最多 4 个，小写，只能是字母数字或连字符
- **标题**：60-80 个字符，关键词前置
- **描述**：最多 170 个字符
- **语气**：开发者对开发者，避免营销话术

### CLI 命令

```bash
cd toolkit

# 发布 Markdown 文件
npx tsx src/cli.ts publish article.md --tags "typescript,webdev"

# 本地预览和校验
npx tsx src/cli.ts preview article.md

# 校验 YouMind / Dev.to 连通性
npx tsx src/cli.ts validate

# 列出你的文章
npx tsx src/cli.ts list --page 1

# 只列出草稿
npx tsx src/cli.ts list-drafts --page 1

# 只列出已发布文章
npx tsx src/cli.ts list-published --page 1

# 按文章 ID 直接发布
npx tsx src/cli.ts publish-article 12345

# 按文章 ID 退回草稿
npx tsx src/cli.ts unpublish-article 12345
```

### 发布状态

Skill 默认以草稿模式发布。草稿应该从 Dev.to 的 dashboard 打开：`https://dev.to/dashboard`，因为公开文章链接在真正发布前可能会 404。若要直接公开，使用 `--publish`。

### 付费要求

Dev.to OpenAPI 现在要求 YouMind 付费套餐（Pro / Max）。如果当前账号未升级，API 会返回 `402`，并引导用户到 [YouMind Pricing](https://youmind.com/pricing) 升级。

---

## 常见问题

**Q: 出现 401 或鉴权错误**

先检查 `youmind.api_key` 或 `YOUMIND_API_KEY`。现在 skill 只用 YouMind API Key 做鉴权。

**Q: 发布时报 Dev.to 未连接**

先去 YouMind 里完成 Dev.to 账号连接。Dev.to token 保存在 YouMind，不在 `config.yaml`。

**Q: 标签不存在**

Dev.to 的标签由社区维护，skill 会自动做校验和裁剪。

**Q: 能更新已发布文章吗？**

可以。YouMind 暴露的 Dev.to OpenAPI 支持 create / get / update / list 这几个流程。

**Q: 能单独发布草稿或撤回已发布文章吗？**

可以。现在 CLI 和 YouMind Dev.to OpenAPI 都支持 `publishArticle` / `unpublishArticle`，也支持分别列出 drafts 和 published。

---

## 许可证

MIT
