# YouMind Hashnode Skill

Hashnode AI 写作发布 Skill。对 Agent 说一句话，自动完成调研、写作、SEO 优化、发布全流程。

---

## 一句话能干嘛

| 你说 | Skill 做 |
|------|----------|
| `发布一篇关于微服务架构的 Hashnode 文章` | 全自动：选题 -> 写作 -> Hashnode 适配 -> 发布草稿 |
| `把这篇 Markdown 发到 Hashnode` | 跳过写作，直接排版发布 |
| `校验我的 Hashnode 文章` | 检查标签、结构、SEO 元数据 |
| `列出我的 Hashnode 文章` | 获取并展示已发布和草稿的文章 |

---

## 获取凭证

### 获取 Hashnode Personal Access Token

> Hashnode 开发者设置页：<https://hashnode.com/settings/developer>

**第 1 步 -- 登录 Hashnode**

打开 [Hashnode](https://hashnode.com)，使用你的账号登录。

**第 2 步 -- 进入 Account Settings > Developer**

点击右上角头像 -> **Account Settings** -> 左侧菜单选择 **Developer**。

直达链接：<https://hashnode.com/settings/developer>

**第 3 步 -- 生成 Personal Access Token**

1. 点击 **"Generate New Token"** 按钮
2. 输入 Token 名称（如 `youmind`）
3. 复制生成的 Personal Access Token（只显示一次，请立即保存）

**第 4 步 -- 获取 Publication ID**

你的 Publication ID 可以通过以下方式获取：

- **方法 1 -- 博客设置页 URL**：打开你的 Hashnode 博客 -> Dashboard -> 查看 URL 中的 publication ID
- **方法 2 -- GraphQL API 查询**：使用以下查询获取你的 publications 列表：

```graphql
query {
  me {
    publications(first: 10) {
      edges {
        node {
          id
          title
          url
        }
      }
    }
  }
}
```

在 Hashnode 的 [API Playground](https://gql.hashnode.com) 中执行此查询。

**第 5 步 -- 填入配置**

将 Token 和 Publication ID 填入 `config.yaml`：

```yaml
hashnode:
  token: "your-personal-access-token-here"
  publication_id: "your-publication-id-here"
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
| `hashnode.token` | **是** | Hashnode Personal Access Token，详见下方获取步骤 |
| `hashnode.publication_id` | **是** | 你的 Hashnode Publication ID |
| `youmind.api_key` | 推荐 | 用于知识库搜索、联网搜索、文章归档 -> [获取 API Key](https://youmind.com/settings/api-keys?utm_source=youmind-hashnode-article) |

---

## YouMind 集成

Hashnode Skill 接入 [YouMind](https://youmind.com) 知识库，获得更强大的内容创作能力。

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

### Hashnode 内容规范

- **标题**：50-70 个字符，SEO 优化，关键词前置
- **副标题**：引人入胜的 hook，Hashnode 会突出显示
- **标签**：最多 5 个，必须从 Hashnode 已有标签中选择
- **封面图**：推荐 1600x840 像素，使用 URL 引用
- **Canonical URL**：跨平台发布时务必设置，避免 SEO 重复内容惩罚
- **Meta 描述**：最多 160 个字符，用于搜索引擎

### CLI 命令

```bash
cd toolkit

# 发布 Markdown 文件
npx tsx src/cli.ts publish article.md --tags "graphql,api"

# 本地预览和校验
npx tsx src/cli.ts preview article.md

# 验证 API 连通性
npx tsx src/cli.ts validate

# 列出你的文章
npx tsx src/cli.ts list
```

### Hashnode 特色功能

- **自定义域名**：Hashnode 支持将博客绑定到你的自定义域名
- **系列文章**：可将多篇文章组织成系列
- **Newsletter**：发布时可同时发送邮件通知订阅者
- **GraphQL API**：Hashnode 使用 GraphQL API，功能强大且灵活

---

## 常见问题

**Q: Token 无效或 401 错误**

重新检查 `config.yaml` 中的 `hashnode.token` 是否正确。如果 Token 已过期或被撤销，回到 <https://hashnode.com/settings/developer> 重新生成。

**Q: Publication ID 在哪里找？**

最简单的方法：使用 `validate` 命令，它会自动获取并显示你的 Publication ID。或者在 Hashnode API Playground (<https://gql.hashnode.com>) 中查询。

**Q: 标签不存在**

Hashnode 的标签是从已有标签库中选择的。Skill 会自动校验并建议匹配的标签。

**Q: 文章发布后如何编辑？**

可以通过 Hashnode GraphQL API 更新文章，或者直接在 Hashnode Dashboard 中编辑。

**Q: 封面图怎么设置？**

在 Markdown front matter 中添加 `coverImageURL`，或者在对话中告诉 Skill 你想要的封面图 URL。

---

## 许可证

MIT
