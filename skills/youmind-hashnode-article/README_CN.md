# YouMind Hashnode Skill

通过 YouMind OpenAPI 写作并发布 Hashnode 文章。

本地 skill 现在只需要 `YouMind API Key`。Hashnode 的 token 和 publication 只需要在 YouMind 里连接一次，后端会自动使用你在 YouMind 中保存的凭证。

## 前置要求

- Node.js >= 18
- 可用的 YouMind 付费计划，用于文章分发 OpenAPI
- 已在 YouMind 连接 Hashnode 账号: [https://youmind.com/settings/connector](https://youmind.com/settings/connector)
- YouMind API Key: [https://youmind.com/settings/api-keys](https://youmind.com/settings/api-keys)

## 本地配置

```bash
cd toolkit
npm install
npm run build
cd ..
cp config.example.yaml config.yaml
```

本地只需要填写 YouMind：

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

命令会统一从本地 `config.yaml` 读取 `youmind.api_key` 和 `youmind.base_url`。
文档里的域名固定写 `https://youmind.com/openapi/v1`。如果你要联调本地 `youapi`，只改你本地的 `config.yaml`，不要改文档或命令示例。

## 当前行为

- 支持草稿，`publish` 默认先进草稿。
- 支持直接公开发布，使用 `--publish`。
- 如果你没有在 YouMind 里连接 Hashnode，命令会直接提示去 connector 页面。
- 如果你的 YouMind 套餐不满足要求，后端会返回升级链接 [https://youmind.com/pricing](https://youmind.com/pricing)。
- 本地预览文件统一写入 `output/`，该目录已加入 gitignore。

## 常用命令

```bash
cd toolkit

# 校验 YouMind -> Hashnode 连通性
node dist/cli.js validate

# 创建 Hashnode 草稿
node dist/cli.js publish ../article.md --draft

# 直接发布
node dist/cli.js publish ../article.md --publish

# 查看草稿
node dist/cli.js list-drafts --page 1 --limit 10

# 查看已发布文章
node dist/cli.js list-published --page 1 --limit 10

# 发布已有草稿
node dist/cli.js publish-draft <draft_id>

# 获取单篇草稿 / 文章
node dist/cli.js get-draft <draft_id>
node dist/cli.js get-post <post_id>

# 本地预览 / 标签查询
node dist/cli.js preview ../article.md
node dist/cli.js search-tags typescript
```

## 错误提示

如果还没有在 YouMind 里连接 Hashnode，CLI 会显示类似：

```text
Hashnode account is not connected in YouMind.
Go to https://youmind.com/settings/connector and connect your Hashnode account first.
```

如果套餐不足，会返回：

```text
Upgrade plan: https://youmind.com/pricing
```

## 说明

- Hashnode 标签查询目前是精确或 slug 风格匹配，因为官方 API 提供的是精确 tag lookup，不是完整的模糊搜索。
- 草稿需要在 Hashnode 对应 publication 的后台里继续检查和发布。
- skill 不再读取本地 `hashnode.token` 或 `hashnode.publication_id`。
