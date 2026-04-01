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

> 应用程序密码（Application Passwords）是 WordPress 5.6+ 内置的 REST API 认证方式，无需安装额外插件。
>
> 前提条件：WordPress 5.6+、站点启用 HTTPS、REST API 未被安全插件禁用。

**第 1 步 -- 打开 WordPress 登录页**

在浏览器中访问你的 WordPress 登录页面：

```
https://<your-domain>/wp-login.php
```

将 `<your-domain>` 替换为你的实际域名（如 `https://myblog.com/wp-login.php`）。

输入用户名和密码，点击 **"登录"** 进入 WordPress 管理后台（仪表盘）。

**第 2 步 -- 进入个人资料页**

登录后进入管理后台，在 **左侧菜单栏** 中找到 **"用户"**，点击展开后选择 **"个人资料"**。

或者直接在浏览器地址栏输入：

```
https://<your-domain>/wp-admin/profile.php
```

**第 3 步 -- 找到应用程序密码区域**

在个人资料页中 **向下滚动到底部**，找到 **"Application Passwords"**（应用程序密码）区域。

> **找不到这个区域？** 可能的原因：
> - **站点使用 `http://` 而非 `https://`** —— WordPress 仅在 HTTPS 下显示此功能。解决办法：在服务器上编辑 WordPress 根目录下的 `wp-config.php`，在 `/* That's all, stop editing! */` 这行 **之前** 添加：
>   ```php
>   define( 'WP_ENVIRONMENT_TYPE', 'local' );
>   ```
>   保存后刷新个人资料页即可看到应用程序密码区域。
> - WordPress 版本低于 5.6 —— 在 **仪表盘 -> 更新** 中查看当前版本
> - 安全插件（如 Wordfence、iThemes Security）禁用了此功能 —— 检查插件设置
> - 主机商限制 —— 联系主机商确认

**第 4 步 -- 创建新的应用程序密码**

1. 在 **"New Application Password Name"** 输入框中输入一个名称，如 `youmind`（仅用于标识，不影响功能）
2. 点击 **"Add New Application Password"** 按钮

**第 5 步 -- 复制生成的密码**

系统会生成一组密码（格式类似 `abcd EFGH 1234 ijkl MNOP 5678`），显示在蓝色背景框中。

- **此密码只显示一次**，关闭页面后无法再次查看，请立即复制
- 密码中的空格可以保留也可以去掉，WordPress 会自动处理

**第 6 步 -- 记下你的用户名**

在当前个人资料页 **顶部** 可以看到 **"用户名"** 字段（不可修改的灰色文字），记下这个值。

> **注意：** 这里需要的是 WordPress **用户名**（如 `admin`），不是昵称，也不是邮箱地址。

**第 7 步 -- 填写配置文件**

将以下三项信息填入 `config.yaml`：

```yaml
wordpress:
  site_url: "https://<your-domain>"     # 你的站点地址（不带末尾 /）
  username: "admin"                       # 第 6 步看到的用户名
  app_password: "abcd EFGH 1234 ijkl"    # 第 5 步复制的应用程序密码
```

> **常见问题：**
> - `site_url` 不要加末尾斜杠，如 `https://myblog.com` 而非 `https://myblog.com/`
> - 填入密码后报 401 错误 —— 检查用户名是否用了邮箱、密码是否有多余换行符
> - 如果忘记复制密码 —— 回到个人资料页，删除旧的应用程序密码，重新创建一个即可

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

### 什么是 WordPress？我需要什么？

WordPress 不是一个桌面应用，它是运行在服务器上的 **Web 应用程序**（PHP + MySQL）。你需要一个 **已经在线运行的 WordPress 站点**（能通过 `https://<your-domain>` 访问的那种），而不是下载的源码目录。

获取方式：
- **托管主机**（最简单）：在 SiteGround、Bluehost、阿里云等主机商购买 WordPress 主机，一键安装
- **自行部署**：在自己的服务器上搭建 LAMP/LNMP 环境，部署 WordPress

### 看不到 Application Passwords 区域

可能原因及解决办法：

| 原因 | 解决办法 |
|------|----------|
| 站点使用 `http://` 而非 `https://` | 在 `wp-config.php` 中添加 `define( 'WP_ENVIRONMENT_TYPE', 'local' );`，保存后刷新页面 |
| WordPress 版本低于 5.6 | 升级 WordPress，或安装 "Application Passwords" 插件 |
| 安全插件禁用 | 检查 Wordfence / iThemes Security 等插件设置 |
| 主机商限制 | 联系主机商确认 |

### 发布报 401 错误

- 检查 `username` 是否填的是 WordPress **用户名**（如 `admin`），而不是邮箱或昵称
- 检查 `app_password` 是否有多余空格或换行符
- 确认应用程序密码未被撤销（回到个人资料页查看）

### `validate` 通过但 `publish` 超时

这是最常见的部署卡点。表现为 `validate`（GET 请求）能通过，但 `publish`（POST 请求）一直超时无响应。

**根因：** 服务器的 Nginx 或防火墙配置拦截了 POST 请求。

**排查步骤：**

1. 在服务器上本地测试 POST 是否正常：
   ```bash
   curl -s -X POST "http://localhost:8080/wp-json/wp/v2/posts" \
     -u "用户名:应用程序密码" \
     -H "Content-Type: application/json" \
     -d '{"title":"test","content":"hello","status":"draft"}'
   ```
   如果本地能通但外部不行，说明是防火墙/Nginx 规则问题。

2. 检查 Nginx 配置，确保没有限制 POST 方法或请求体大小：
   ```nginx
   # 确保允许 POST 方法
   # 适当增大请求体限制
   client_max_body_size 10m;
   ```

3. 检查云服务器安全组规则（如腾讯云、阿里云、AWS），确保入站规则允许对应端口的 POST 请求。

### 图片上传失败

确保 WordPress 用户拥有 `upload_files` 权限。管理员和编辑角色默认拥有此权限。

### REST API 不可用

某些安全插件可能禁用了 REST API。检查安全插件设置，确保 `/wp-json/wp/v2/` 端点可访问。可以在浏览器中直接访问 `https://<your-domain>/wp-json/wp/v2/posts` 测试。

---

## 许可证

MIT
