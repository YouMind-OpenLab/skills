# YouMind Medium Skill

Medium AI 写作发布 Skill。对 Agent 说一句话，自动完成调研、写作、发布全流程。

> **注意：** Medium 的 Publishing API 已官方废弃但仍可使用。本 Skill 仅支持 **发布文章** -- 不支持编辑、删除或列出文章。发布后如需修改，请在 Medium 网页端操作。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于远程办公的 Medium 文章` | 全自动：选题 -> 写作 -> Medium 适配 -> 发布草稿 |
| `把这篇 Markdown 发到 Medium` | 跳过写作，直接排版发布 |
| `验证我的 Medium Token` | 检查 Token 有效性并获取用户信息 |
| `列出我的 Medium Publications` | 获取并展示你的 Publications |

---

## 获取凭证

### 获取 Medium Integration Token

> Medium 安全设置页：<https://medium.com/me/settings/security>

**第 1 步 -- 登录 Medium**

打开 [Medium](https://medium.com)，使用你的账号登录。

**第 2 步 -- 进入 Settings > Security and apps**

点击右上角头像 -> **Settings** -> 选择 **Security and apps**。

直达链接：<https://medium.com/me/settings/security>

**第 3 步 -- 生成 Integration Token**

在页面中找到 **"Integration tokens"** 区域：

1. 在 "Token description" 输入框中输入描述（如 `youmind`）
2. 点击 **"Get integration token"** 按钮
3. 复制生成的 Token（只显示一次，请立即保存）

**第 4 步 -- 获取 Publication ID（可选）**

如果你想发布到某个 Publication 而不是个人主页：

1. 配置好 `medium.token` 后，运行 `validate` 命令
2. 运行 `publications` 命令获取你的 Publications 列表
3. 从列表中复制目标 Publication 的 ID

```bash
cd toolkit
npx tsx src/cli.ts validate       # 验证 Token
npx tsx src/cli.ts publications   # 列出 Publications
```

**第 5 步 -- 填入配置**

将 Token 填入 `config.yaml`：

```yaml
medium:
  token: "your-integration-token-here"
  publication_id: ""     # 可选：发布到指定 Publication
```

> **注意：** Medium API 已废弃但仍可用。仅支持发布文章（POST），不支持编辑、删除或列出文章。Token 可能在未来失效，届时请重新生成。

---

## 安装

> 环境要求：Node.js >= 18

```bash
# 1. 安装依赖
cd toolkit && npm install && npm run build && cd ..

# 2. 生成配置文件
cp config.example.yaml config.yaml

# 3. 填写凭证
```

`config.yaml` 需要填写以下凭证：

| 字段 | 必填 | 说明 |
|------|------|------|
| `medium.token` | **是** | Medium Integration Token，详见下方获取步骤 |
| `medium.publication_id` | 否 | 可选，发布到指定 Publication（使用 `publications` 命令获取） |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 -> [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-medium-article) |

---

## YouMind 集成

Medium Skill 接入 [YouMind](https://youmind.com) 知识库，获得更强大的内容创作能力。

### 知识库语义搜索

搜索你 YouMind 中收藏的文章、笔记、书签作为写作素材。AI 会根据语义匹配最相关的内容，而不仅仅是关键词。

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

### Medium 内容规范

- **标题**：简洁有力，6-12 个单词为佳
- **副标题**：补充说明标题，吸引读者点击
- **开头**：前两段是关键，Medium 用它们作为预览。用故事或问题开头
- **段落**：短段落（2-3 句），适合移动端阅读
- **图片**：Medium 原生支持图片嵌入，善用配图提升阅读体验
- **标签**：最多 5 个，选择热门且相关的标签提升曝光

### CLI 命令

```bash
cd toolkit

# 以草稿模式发布（默认）
npx tsx src/cli.ts publish article.md --draft

# 公开发布
npx tsx src/cli.ts publish article.md --public

# 以未列出模式发布
npx tsx src/cli.ts publish article.md --unlisted

# 指定标签
npx tsx src/cli.ts publish article.md --tags "ai,writing,productivity"

# 发布到指定 Publication
npx tsx src/cli.ts publish article.md --publication "pub-id-here"

# 设置 Canonical URL
npx tsx src/cli.ts publish article.md --canonical-url "https://myblog.com/post"

# 验证 Token
npx tsx src/cli.ts validate

# 列出你的 Publications
npx tsx src/cli.ts publications
```

### 发布状态选项

| 选项 | 说明 |
|------|------|
| `--draft` | 保存为草稿（默认） |
| `--public` | 直接公开发布 |
| `--unlisted` | 发布但不在 Medium 首页展示 |

### Medium API 限制

Medium API 仅支持以下操作：

- 创建文章 (POST)
- 获取用户信息 (GET)
- 获取 Publications 列表 (GET)

**不支持**：更新文章、删除文章、列出文章、数据分析。

---

## 常见问题

**Q: Token 无效或 401 错误**

重新检查 `config.yaml` 中的 `medium.token` 是否正确。如果 Token 失效，回到 <https://medium.com/me/settings/security> 重新生成。

**Q: Medium API 是否还能用？**

截至目前仍可使用。Medium 已官方废弃此 API 但未关闭。如果未来 API 被关闭，Skill 会提示错误。

**Q: 发布后怎么编辑？**

Medium API 不支持编辑。发布后请在 Medium 网页端 (<https://medium.com>) 直接编辑。

**Q: 能发布到 Publication 吗？**

可以。在 `config.yaml` 中设置 `medium.publication_id`，或在发布时使用 `--publication` 参数。使用 `publications` 命令查看你可用的 Publications。

**Q: 图片怎么处理？**

Medium API 支持通过 URL 引用图片。Skill 会自动将 Markdown 中的图片链接转换为 Medium 格式。本地图片需先上传到图床。

---

## 许可证

MIT
