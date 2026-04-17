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
npx tsx src/cli.ts preview ../output/article.md
npx tsx src/cli.ts publish ../output/article.md --tags "ai,newsletter"
npx tsx src/cli.ts list --status draft
```

## 说明

- 发布内容走 HTML，不是原始 Markdown。
- 默认发 `draft`。
- 如果 Beehiiv 侧没有给该 publication 开 Send API 权限，建文可能会返回 `403`。
