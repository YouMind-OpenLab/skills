# YouMind 内容分发中枢

一句话发全平台。AI 驱动的多平台内容分发中枢。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `把这篇文章发到所有平台` | 自动识别已配置的平台，逐个适配并发布 |
| `发一篇关于 AI 编程的文章到 Ghost 和微信` | 全自动：选题 → 写作 → 平台适配 → 分别发布草稿 |
| `帮我把 Docker 最佳实践发到 Dev.to 和 Hashnode` | 调研 → 写作 → 按平台调整风格和格式 → 发布草稿 |
| `全平台发布：AI 编程的未来` | 一键分发到所有已配置的平台 |

---

## 配置 — 一个 Key，全平台通

所有子 Skill 通过 YouMind OpenAPI 代理平台请求。你只需要**一个 YouMind API Key**——各平台凭证（OAuth Token、API Key、应用密码）在 YouMind 里一次性绑定，加密存储在服务端。

### 第 1 步：获取 YouMind API Key

1. 打开 [YouMind API Keys](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch)
2. 创建密钥 → 复制 `sk-ym-xxxx`
3. 把 API Key 统一写到 `~/.youmind/config.yaml`

### 第 2 步：在 YouMind 绑定平台

打开 [YouMind Connector 设置](https://youmind.com/settings/connector?utm_source=youmind-article-dispatch)，连接你要用的平台（一键 OAuth 或粘贴凭证）。YouMind 加密存储，Skill 不接触你的平台密钥。

| 平台 | Skill | 绑定方式 |
|------|-------|---------|
| Dev.to | youmind-devto-article | Connector 中 OAuth 绑定 |
| Hashnode | youmind-hashnode-article | Connector 中粘贴 PAT |
| WordPress | youmind-wordpress-article | Connector 中填 站点URL + 应用密码 |
| Ghost | youmind-ghost-article | Connector 中填 站点URL + Admin API Key |
| LinkedIn | youmind-linkedin-article | Connector 中 OAuth 绑定 |
| X/Twitter | youmind-x-article | Connector 中 OAuth 绑定 |
| WeChat | youmind-wechat-article | Connector 中粘贴 AppID/AppSecret |
| Qiita | youmind-qiita-article | Connector 中 OAuth 绑定 |

> **本地不存储平台凭证。** 你只需要在 `~/.youmind/config.yaml` 里放 `youmind.api_key`，YouMind 在服务端代理所有平台 API 调用。

---

## 安装

> 环境要求：Node.js >= 18

```bash
cd youmind-article-dispatch
mkdir -p ~/.youmind/config
cp shared/config.example.yaml ~/.youmind/config.yaml
```

Dispatch 本身不需要平台凭证——它是分发中枢。共享 YouMind 配置统一放在 `~/.youmind/config.yaml`，文章类 skill 只读取 `~/.youmind/config.yaml` 与可选的 `~/.youmind/config/<skill>.yaml`。

---

## YouMind 集成

Dispatch 及其所有子 Skill 均可接入 [YouMind](https://youmind.com) 知识库，获得更强大的内容创作能力。

### 知识库语义搜索

搜索你 YouMind 中收藏的文章、笔记、书签作为写作素材。AI 会根据语义匹配最相关的内容，而不仅仅是关键词。

### 联网搜索

搜索互联网获取实时信息和热门话题。写文章时自动引用最新数据和趋势。

### 文章归档

发布后，自动将文章保存回你的 YouMind 知识库，方便日后引用和二次创作。

### 素材挖掘

浏览 YouMind 中的看板和文档，提取相关素材用于内容创作。

### 获取 API Key

访问 [YouMind API Key 设置页](https://youmind.com/settings/api-keys?utm_source=youmind-article-dispatch) 获取你的 API Key，填入 `~/.youmind/config.yaml` 的 `youmind.api_key` 字段。

---

## 使用技巧

### 分发策略

- **单平台**：直接指定平台名，如 `写一篇 Dev.to 文章`
- **多平台**：列出平台名，如 `发到 Dev.to、LinkedIn 和 Ghost`
- **全平台**：说 `发到所有平台` 或 `全平台发布`

### 内容适配

Dispatch 不是简单复制粘贴。每个子 Skill 会根据平台特性自动调整：

- **Dev.to**：技术深度、代码示例、TL;DR 开头
- **LinkedIn**：职业视角、行业洞察、简洁段落
- **Ghost**：编辑级 Newsletter 内容，会员分层，邮件优先
- **WeChat**：中文本地化、公众号排版、配图
- **X/Twitter**：精炼为推文串、话题标签
- **Qiita**：面向日本开发者、GFM Markdown、环境信息、笔记框

### 跨平台 SEO

使用 `canonical-url` 标记原始来源，避免搜索引擎重复内容惩罚。

---

## 常见问题

**Q: 某个平台发布失败，其他平台会受影响吗？**

不会。Dispatch 会独立处理每个平台。失败的平台会在最终报告中标注，已成功的不受影响。

**Q: 如何只发布到部分平台？**

在指令中明确列出平台名。Dispatch 只会调用你指定的平台。

**Q: 需要先安装所有子 Skill 吗？**

不需要。只安装和配置你要用的平台对应的 Skill 即可。

**Q: 发布顺序是什么？**

Dispatch 按照你列出的顺序依次发布。如果说 `全平台发布`，则按内部默认顺序。

---

## 许可证

MIT
