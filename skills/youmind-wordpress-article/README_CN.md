# YouMind WordPress Skill

WordPress AI 写作发布 Skill。对 Agent 说一句话，它就可以调研、写作、Markdown 转 HTML、上传特色图片，并通过你已经在 YouMind 中连接好的 WordPress 站点发布。

---

## 能做什么

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于远程办公的 WordPress 文章` | 调研 -> 写作 -> Markdown->HTML -> 上传配图 -> 发布草稿 |
| `列出我的 WordPress 文章` | 获取并展示最近的文章列表 |
| `上传这张图片到 WordPress` | 上传媒体文件到 WordPress 媒体库 |
| `检查我的 WordPress 配置` | 检查 YouMind API Key 和 WordPress 连通性 |

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

命令会统一从本地 `config.yaml` 读取 `youmind.api_key` 和 `youmind.base_url`。
文档里的域名固定写 `https://youmind.com/openapi/v1`。如果你要联调本地 `youapi`，只改你本地的 `config.yaml`，不要改文档或命令示例。

### 发布前置条件

所有 WordPress 凭证（站点 URL + 用户名 + Application Password）都在 YouMind -> Connector Settings 里一次性配置完成。本 skill 只需要 `youmind.api_key`。

发布前，请先打开 [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wordpress-article)，选择 **WordPress**，粘贴你的站点 URL、用户名，以及在 WP 后台 **用户 -> 个人资料 -> Application Passwords** 里生成的应用程序密码。YouMind 加密保存，并在保存时调用 `/wp-json/wp/v2/users/me` 校验连通性。

本 skill 不再读取本地的 `wordpress.site_url` / `wordpress.username` / `wordpress.app_password`，也不应该再要求用户把 WordPress 凭证填到这个仓库里。换密码时：先在 WP 后台吊销旧密码，再去 YouMind 断开并重新连接 WordPress，粘贴新生成的密码。

### 获取 YouMind API Key

访问 [YouMind API Key 设置页](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article)，创建并填入 `youmind.api_key`。

### 验证配置

```bash
cd toolkit && npx tsx src/cli.ts validate
```

看到 `OK: Connected to WordPress site as <username>` 即表示配置成功。

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

> **获取 YouMind API Key：** [youmind.com/settings/api-keys](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article)

---

## 使用技巧

### CLI 命令

```bash
# 以草稿发布 Markdown 文件
npx tsx src/cli.ts publish article.md --draft

# 立即发布
npx tsx src/cli.ts publish article.md --publish

# 带标签和分类发布
npx tsx src/cli.ts publish article.md --tags "AI,tech" --category "Technology"

# 本地预览 HTML
npx tsx src/cli.ts preview article.md

# 列出最近文章
npx tsx src/cli.ts list --per-page 10

# 上传媒体文件
npx tsx src/cli.ts upload-media cover.jpg

# 验证凭证
npx tsx src/cli.ts validate
```

### 内容创作建议

- **让 Agent 自动选题** -- 直接说"写一篇关于 XX 的文章"，Skill 会自动联网调研再动笔
- **指定发布状态** -- 默认发布为草稿，加 `--publish` 可直接发布
- **配图上传** -- 支持上传图片到 WordPress 媒体库，自动设为文章特色图片
- **标签和分类** -- 使用 `--tags` 和 `--category` 参数精准归类

---

## 常见问题

**Q: 什么是 WordPress？我需要什么？**

WordPress 是运行在服务器上的 **Web 应用程序**（PHP + MySQL），不是桌面应用。你需要一个 **在线可访问的 WordPress 站点**（能通过 `https://<your-domain>` 打开的那种）——最快路径是在 SiteGround / Bluehost / DigitalOcean / 阿里云 等主机商买 WordPress 托管主机；也可以自己搭 LAMP/LNMP 部署。版本需要 5.6+ 且 REST API 没被禁用。

**Q: 出现 401 或鉴权错误**

先检查 `config.yaml` 里的 `youmind.api_key`。现在 skill 只用 YouMind API Key 做鉴权。如果 YouMind 返回 "WordPress 未连接" 或代理鉴权失败，打开 [YouMind Connector Settings](https://youmind.com/settings/connector?utm_source=youmind-wordpress-article)，重新填写 WP 站点 URL / 用户名 / Application Password 并保存。YouMind 会在保存时调用 `/wp-json/wp/v2/users/me` 做连通性校验。

**Q: WP 后台看不到 Application Passwords 区域**

应用程序密码要求 WordPress 5.6+、HTTPS、且 REST API 没被安全插件屏蔽。

| 原因 | 解决办法 |
|------|----------|
| 站点使用 `http://` 而非 `https://` | 在 `wp-config.php` 中加入 `define( 'WP_ENVIRONMENT_TYPE', 'local' );`，保存后刷新个人资料页 |
| WordPress 版本低于 5.6 | 升级，或安装 "Application Passwords" 插件 |
| 安全插件禁用 | 检查 Wordfence / iThemes Security 设置 |
| 主机商限制 | 联系主机商 |

**Q: YouMind 已连接，但发布超时**

一般是站点 Nginx 或防火墙拦截了外部 POST。先在服务器上确认 POST 通：

```bash
curl -s -X POST "https://<your-domain>/wp-json/wp/v2/posts" \
  -u "<用户名>:<应用程序密码>" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","content":"hello","status":"draft"}'
```

本地通但 YouMind 代理仍超时，就检查 Nginx（`client_max_body_size 10m;`、允许 POST）和云服务器安全组规则（阿里云 / 腾讯云 / AWS / GCP），确保入站 POST 没被过滤。

**Q: 图片上传失败**

确认你在 YouMind 连接的 WP 用户具备 `upload_files` 权限。管理员和编辑角色默认都有。

**Q: REST API 不可用**

某些安全插件会屏蔽 `/wp-json/`。在浏览器里访问 `https://<your-domain>/wp-json/wp/v2/posts`——如果 403，就去安全插件里把 REST API 加进允许列表。

**Q: 没有连接 WordPress 能先本地预览吗？**

可以。`preview` 只依赖本地的 Markdown -> HTML 转换。

---

## 许可证

MIT
