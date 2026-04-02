# YouMind Qiita 技能

AI 驱动的 Qiita 文章写作与发布。告诉 Agent 一个主题，它会自动完成调研、写作、排版和发布。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `写一篇关于 Docker 最佳实践的 Qiita 文章` | 完整流程：调研 → 写作 → 适配 → 发布为限定共享 |
| `把这篇 Markdown 发布到 Qiita` | 跳过写作，直接格式化并发布 |
| `帮我检查这篇文章是否符合 Qiita 规范` | 检查标签、代码块、结构 |
| `列出我的 Qiita 文章` | 获取并展示你发布的文章 |

---

## 获取凭证

### 获取 Qiita Access Token

> Qiita Access Token 设置页：<https://qiita.com/settings/applications>

**第 1 步 -- 登录 Qiita**

用你的账号登录 [Qiita](https://qiita.com)。

**第 2 步 -- 进入设置 > Applications**

点击右上角头像 -> **Settings** -> 选择 **Applications**。

直达链接：<https://qiita.com/settings/applications>

**第 3 步 -- 生成 Personal Access Token**

在 **Personal Access Tokens** 区域：

1. 点击 **"Generate new token"**
2. 输入描述（如 `youmind`）
3. 勾选 **`write_qiita`** 权限（创建和更新文章所需）
4. 点击 **"Generate token"**
5. 复制生成的 Token（只显示一次，请立即保存）

**第 4 步 -- 填写配置**

将 Access Token 填入 `config.yaml`：

```yaml
qiita:
  access_token: "your-access-token-here"
```

---

## 安装

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 创建配置文件（如果 config.yaml 不存在）
cp config.example.yaml config.yaml

# 3. 在 config.yaml 中填入 API 密钥
```

`config.yaml` 中的必填字段：

| 字段 | 是否必填 | 说明 |
|------|----------|------|
| `qiita.access_token` | **是** | Qiita 个人访问令牌，见上述步骤 |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 → [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-qiita-article) |

---

## YouMind 集成

Qiita 技能可接入 [YouMind](https://youmind.com) 知识库，获得更强大的内容创作能力。

### 知识库语义搜索

搜索你 YouMind 中收藏的文章、笔记、书签作为写作素材。AI 会根据语义匹配最相关的内容。

### 联网搜索

搜索互联网获取实时信息和热门话题。写文章时自动引用最新数据和趋势。

### 文章归档

发布后，自动将文章保存回你的 YouMind 知识库，方便日后引用和二次创作。

### 素材挖掘

浏览 YouMind 中的看板和文档，提取相关素材用于内容创作。

### 获取 API Key

访问 [YouMind API Key 设置页](https://youmind.com/settings/api-keys) 获取你的 API Key，填入 `config.yaml` 的 `youmind.api_key` 字段。

---

## 使用技巧

### Qiita 内容指南

- **环境信息**：务必包含版本号、操作系统、工具——Qiita 读者期望可复现的示例
- **代码块**：必须指定语言（如 ` ```python `），可用 ` ```python:main.py ` 显示文件名
- **标签**：最多 5 个，自由填写（如 `Python`、`Docker`、`TypeScript`、`初心者`）
- **标题**：具体、技术名称在前（如 `TypeScript で CLI ツールを作る`）
- **语气**：知识分享、技术性、同行交流
- **语言**：跟随用户的输入语言（日语或英语）

### CLI 命令

```bash
cd toolkit

# 发布 Markdown 文件
npx tsx src/cli.ts publish article.md --tags "Python,API,Qiita"

# 本地预览和验证
npx tsx src/cli.ts preview article.md

# 验证 API 连通性
npx tsx src/cli.ts validate

# 列出你的文章
npx tsx src/cli.ts list --page 1
```

### 发布状态

默认以限定共享（private）模式发布。使用 `--public` 公开发布，或在 Qiita 控制台中更改可见性。

---

## 常见问题

**Q: Access Token 无效或 401 错误**

检查 `config.yaml` 中的 `qiita.access_token`。确保 Token 有 `write_qiita` 权限。如已过期，在 <https://qiita.com/settings/applications> 重新生成。

**Q: 标签不生效**

Qiita 标签是自由格式，任何名称都可以。注意标签区分大小写（`Python` ≠ `python`）。使用已有的热门标签可以提高发现率。

**Q: 应该用日语还是英语写？**

Qiita 上大部分内容是日语。英语文章也可以，但受众较小。技能会跟随你的提示语言。

**Q: 什么是限定共享模式？**

限定共享的文章只能通过直链访问，不会出现在搜索结果和信息流中。适合用作草稿或团队分享。

**Q: 可以更新已发布的文章吗？**

可以。Qiita API 支持更新文章内容、标签和可见性。

---

## 许可证

MIT
