# YouMind Beehiiv Skill

通过 YouMind 代理写作并发布 Beehiiv 文章。

## 配置

```bash
cd toolkit && npm install && npm run build && cd ..
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

`~/.youmind/config.yaml` 只放 YouMind API Key：

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

读取顺序：
- `~/.youmind/config/youmind-beehiiv-article.yaml`
- `~/.youmind/config.yaml`

发布前先去 YouMind Connector Settings 里绑定 Beehiiv。

## CLI

```bash
cd toolkit

npx tsx src/cli.ts validate
npx tsx src/cli.ts templates
npx tsx src/cli.ts preview ../output/article.md
npx tsx src/cli.ts publish ../output/article.md --tags "ai,newsletter" --post-template-id post_template_xxx
npx tsx src/cli.ts update post_xxx ../output/article.md --tags "ai,newsletter"
npx tsx src/cli.ts list --status draft --platform both --hidden-from-feed false
```

## 说明

- 发布内容走 HTML，不是原始 Markdown。
- 默认发 `draft`。
- `templates` 对应 Beehiiv 官方 `post_templates`，用它来拿可用的 `postTemplateId`。
- `publish` 支持 Beehiiv 模板 ID，以及 `recipients / emailSettings / webSettings / seoSettings` 这类高级 JSON 入参。
- 如果 Beehiiv 侧没有给该 publication 开 Send API 权限，建文可能会返回 `403`。
- Beehiiv 官方文档目前把 `update post` 标成 `beta / Enterprise`。
