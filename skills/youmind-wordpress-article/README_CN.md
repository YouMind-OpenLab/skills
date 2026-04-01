# YouMind WordPress Skill

WordPress AI 写作发布 Skill。对 Agent 说一句话，自动完成选题、写作、Markdown 转 HTML、上传配图、发布到 WordPress。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于远程办公的 WordPress 文章` | 选题 -> 写作 -> Markdown->HTML -> 上传配图 -> 发布草稿 |
| `列出我的 WordPress 文章` | 获取并展示最近的文章列表 |
| `上传这张图片到 WordPress` | 上传媒体文件到 WordPress 媒体库 |
| `检查我的 WordPress 配置` | 检查 API 凭证和连接状态 |

---

## 获取凭证

### 获取 WordPress 应用程序密码

> WordPress 管理后台：`yourdomain.com/wp-admin`

**第 1 步 -- 登录 WordPress 管理后台**

打开浏览器访问 `https://yourdomain.com/wp-admin`，使用管理员账号登录。

**第 2 步 -- 进入用户资料页**

在左侧菜单中点击 **用户 -> 个人资料**。

**第 3 步 -- 找到应用程序密码**

向下滚动页面，找到 **"Application Passwords"**（应用程序密码）区域。

**第 4 步 -- 创建新密码**

在 "New Application Password Name" 输入框中输入一个名称（如 `youmind`），然后点击 **"Add New Application Password"** 按钮。

**第 5 步 -- 复制密码**

系统会生成一个密码并只显示一次。**立即复制**，填入 `config.yaml` 的 `wordpress.app_password` 字段。

**第 6 步 -- 填写其余配置**

- `wordpress.username` -- 你的 WordPress 登录用户名
- `wordpress.site_url` -- 你的网站地址（如 `https://myblog.com`）

> **注意：**
> - 需要 WordPress 5.6+ 且启用了 REST API
> - 站点必须使用 HTTPS
> - 部分主机商可能禁用了此功能，如果看不到 Application Passwords 区域，请联系你的主机商

### 验证配置

```bash
cd toolkit && npx tsx src/cli.ts validate
```

---

## 安装

> 环境要求：Node.js >= 18、WordPress 5.6+（需启用 REST API）

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 生成配置文件
cp config.example.yaml config.yaml
```

`config.yaml` 需要填写以下凭证：

| 字段 | 必填 | 说明 |
|------|------|------|
| `wordpress.site_url` | **是** | 你的 WordPress 站点地址（如 `https://myblog.com`） |
| `wordpress.username` | **是** | WordPress 用户名 |
| `wordpress.app_password` | **是** | 应用程序密码（详见下方获取步骤） |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 -> [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-wordpress-article) |

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

**发布报 401 错误** -- 检查用户名和应用程序密码是否正确，确保密码没有多余空格。

**看不到 Application Passwords 区域** -- WordPress 版本可能低于 5.6，或者主机商禁用了此功能。尝试安装 "Application Passwords" 插件作为替代。

**图片上传失败** -- 确保 WordPress 用户拥有 `upload_files` 权限。管理员和编辑角色默认拥有此权限。

**REST API 不可用** -- 某些安全插件可能禁用了 REST API。检查安全插件设置，确保 `/wp-json/wp/v2/` 端点可访问。

---

## 许可证

MIT
