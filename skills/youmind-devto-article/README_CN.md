# YouMind Dev.to Skill

Dev.to AI 写作发布 Skill。对 Agent 说一句话，自动完成调研、写作、排版、发布全流程。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于 AI 编程的 Dev.to 文章` | 全自动：选题 -> 写作 -> Dev.to 适配 -> 发布草稿 |
| `把这篇 Markdown 发到 Dev.to` | 跳过写作，直接排版发布 |
| `校验我的 Dev.to 文章` | 检查标签、front matter、代码块 |
| `列出我的 Dev.to 文章` | 获取并展示已发布的文章 |

---

## 获取凭证

### 获取 Dev.to API Key

> Dev.to API Key 设置页：<https://dev.to/settings/extensions>

**第 1 步 -- 登录 Dev.to**

打开 [Dev.to](https://dev.to)，使用你的账号登录。

**第 2 步 -- 进入 Settings > Extensions**

点击右上角头像 -> **Settings** -> 左侧菜单选择 **Extensions**。

直达链接：<https://dev.to/settings/extensions>

**第 3 步 -- 生成 API Key**

在页面底部找到 **"DEV Community API Keys"** 区域：

1. 在 "Description" 输入框中输入描述（如 `youmind`）
2. 点击 **"Generate API Key"** 按钮
3. 复制生成的 API Key（只显示一次，请立即保存）

**第 4 步 -- 填入配置**

将复制的 API Key 填入 `config.yaml`：

```yaml
devto:
  api_key: "your-api-key-here"
```

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
| `devto.api_key` | **是** | Dev.to API Key，详见下方获取步骤 |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 -> [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-devto-article) |

---

## YouMind 集成

Dev.to Skill 接入 [YouMind](https://youmind.com) 知识库，获得更强大的内容创作能力。

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

### Dev.to 内容规范

- **TL;DR**：每篇文章开头加 TL;DR 摘要，这是 Dev.to 社区惯例
- **代码块**：必须标注语言（如 ` ```typescript `），否则无语法高亮
- **标签**：最多 4 个，小写，仅支持字母数字和连字符（如 `typescript`, `web-dev`）
- **标题**：60-80 个字符，关键词前置，利于 SEO
- **描述**：最多 170 个字符，用于 SEO 和社交分享
- **语气**：开发者对开发者（developer-to-developer），避免营销用语

### CLI 命令

```bash
cd toolkit

# 发布 Markdown 文件
npx tsx src/cli.ts publish article.md --tags "typescript,webdev"

# 本地预览和校验
npx tsx src/cli.ts preview article.md

# 验证 API 连通性
npx tsx src/cli.ts validate

# 列出你的文章
npx tsx src/cli.ts list --page 1
```

### 发布状态

Skill 默认以草稿模式发布，你可以在 Dev.to 后台预览后再公开。

---

## 常见问题

**Q: API Key 无效或 401 错误**

重新检查 `config.yaml` 中的 `devto.api_key` 是否正确。如果 Key 已过期或被删除，回到 <https://dev.to/settings/extensions> 重新生成。

**Q: 标签不存在**

Dev.to 的标签是社区创建的，不能使用不存在的标签。Skill 会自动校验并建议已有标签。

**Q: 文章内容有 AI 味**

在对话中描述你的写作风格偏好，或者提供历史文章作为参考。Skill 会适配你的语气。

**Q: 能更新已发布的文章吗？**

可以。通过 Dev.to API 支持更新文章内容、标签和状态。

---

## 许可证

MIT
