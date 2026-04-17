# YouMind Kit Skill

通过 YouMind 代理写作并发布 Kit 广播/文章。

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
- `~/.youmind/config/youmind-kit-article.yaml`
- `~/.youmind/config.yaml`

发布前先去 YouMind Connector Settings 里绑定 Kit。
另外要先在 Kit 后台把发送邮箱确认完成，否则 createBroadcast 会被拒绝。

## CLI

```bash
cd toolkit

npx tsx src/cli.ts validate
npx tsx src/cli.ts templates --per-page 100
npx tsx src/cli.ts preview ../output/article.md
npx tsx src/cli.ts publish ../output/article.md --public
npx tsx src/cli.ts list --per-page 20
npm run deep-check
```

## 说明

- 发布内容走 HTML，不是原始 Markdown。
- 默认是公开 web feed。
- 发布前可以先用 `templates` 看可用的 `email_template_id`。
- 如果用户只想留内部草稿，用 `--private`。
- 私有稿件可在 `https://app.kit.com/campaigns` 查看。
- 如果发送邮箱还没在 Kit 里确认，创建广播会失败。
- `npm run deep-check` 会把直连 Kit OpenAPI、通用发布接口和 skill CLI 都跑一遍，并自动清理测试广播。
