# YouMind X (Twitter) Skill

AI 驱动的推文写作和发布 Skill。对 Agent 说一句话，自动完成调研、写作、长文拆分为编号推文序列，并通过你在 YouMind 里已连接的 X 账号发布。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发一条关于 AI 编程的推文` | 调研 → 写作 → 适配 280 字符 → 发布推文 |
| `写一个关于 Docker 最佳实践的推文串` | 调研 → 写作 → 拆分为编号序列 → 逐条发布 |
| `直接发这条: "刚刚上线了!"` | 格式化并直接发布 |
| `验证一下 YouMind 配置` | 检查本地 API Key |

---

## 安装

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 创建共享配置
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

`~/.youmind/config.yaml` 只需要填写 YouMind API Key：

```yaml
youmind:
  api_key: "sk-ym-..."
  base_url: "https://youmind.com/openapi/v1"
```

命令按 `~/.youmind/config/youmind-x-article.yaml` -> `~/.youmind/config.yaml` 的顺序读取 `youmind.api_key` 和 `youmind.base_url`。文档和 example 中保持 `https://youmind.com/openapi/v1`。需要对接本地 `youapi` 时，只改 `~/.youmind/config.yaml` 或 skill 专属 override 即可。

### 发布前置条件

发布前，请先在 YouMind 中一键连接你的 X 账号（OAuth 2.0 PKCE）。本 Skill **不再**本地读取 X Developer Portal 的 API Key / Bearer Token / OAuth 1.0a 密钥，也不应当让用户把这些凭证贴到本仓库。

### 获取 YouMind API Key

访问 [YouMind API Key Settings](https://youmind.com/settings/api-keys?utm_source=youmind-x-article)，创建一个 Key，填入 `youmind.api_key`。

---

## 使用技巧

### CLI 命令

把本地 Markdown 源文件放到 skill 的 `output/` 目录下，保持 `git status` 干净。

```bash
cd toolkit

# 发布单条推文
npx tsx src/cli.ts tweet --text "Your tweet here"

# 带图片发推（只接 cdn.gooo.ai URL，最多 4 张）
npx tsx src/cli.ts tweet --text "Check this out" --image https://cdn.gooo.ai/user-files/pic.jpg

# 从文件发布编号推文序列
npx tsx src/cli.ts thread --file ../output/article.md

# 预览序列拆分（不发布）
npx tsx src/cli.ts preview --file ../output/article.md --mode thread

# 预览单条推文
npx tsx src/cli.ts preview --text "Check length" --mode tweet

# 验证 YouMind 凭证（本地 API Key sanity check）
npx tsx src/cli.ts validate
```

### 单推 vs Thread

短内容走单推；长内容自动拆分为编号推文（`1/N`），并以 **X 原生 reply chain** 串链发布 —— skill 把第一条的 `postId` 作为下一条的 `replyToPostId` 逐层传递，读者在你的时间线上看到的是一个完整的 thread。

### 图片

每条推文最多 4 张图片，通过 `--image <url>...` 传入。URL 必须是 `https://cdn.gooo.ai/...` —— YouMind 后端有白名单防 SSRF。本地文件请先上传到 YouMind（通过 YouMind 产品 UI 或 AI 生图），用返回的 CDN URL。

### 付费计划 & Credit

通过 YouMind 发推**需要** Pro/Max 付费计划。每条推文还会消耗 YouMind credit——按推文扣一次 base cost，附图会按图片数量再扣 per-image cost。计划不符会返回 `402` 并附升级链接；credit 不足时在发推前就会 fail-fast，不会产生空扣费。

---

## 常见问题

**Q: 报 401 或鉴权错误**

检查 `~/.youmind/config.yaml` 里的 `youmind.api_key`。本 Skill 现在只通过 YouMind 鉴权。

**Q: 发布时提示 X 没连接**

请先在 YouMind 中连接 X 账号。X 的 access token / refresh token 保存在 YouMind 后端，不在 `~/.youmind/config.yaml`。

**Q: 图片被拒绝了**

YouMind 要求图片 URL 必须在 `cdn.gooo.ai` 域下。外部 URL（Imgur、S3 等）会被拒绝并返回 `X_MEDIA_HOST_NOT_ALLOWED`。请先把图上传到 YouMind。

**Q: 没连 X 能不能本地预览？**

可以。`preview` 命令只跑本地适配逻辑，不会调用 YouMind。

---

## 许可证

MIT
