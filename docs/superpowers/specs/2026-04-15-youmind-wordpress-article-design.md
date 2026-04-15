# YouMind WordPress 文章 Skill 设计

## 问题背景

`youmind-wordpress-article` skill 已有完整骨架（SKILL.md / references / toolkit/src），但 `wordpress-api.ts` 是 mock，本地 `config.yaml` 还硬编码了用户 WP 站的 `siteUrl/username/appPassword`。youapi 后端只有 generic `TokenPlatformPublisherService.publishWordPress` 直接打 `/wp-json/wp/v2/posts`，**不支持 update / delete / get / list / draft 切换 / media 上传 / tag-category 解析**——能力只能算"能发一篇 publish 状态的文章"。

对比刚落地的 Qiita 迁移（commit `f5e22d28c0` + `6962835`），这次需要把 WP 拉到同样的"专用 namespace + skill 端去 mock + 平台层做凭据保管"模式，并补齐缺失的 12 个 endpoint。

## 目标

- 用户只配置 `youmind.api_key` + 在 YouMind 平台绑定 WordPress（siteUrl + username + appPassword 进 YouMind 后端加密存储），skill 即可完成 WP 文章全生命周期管理
- skill 端的 `wordpress-api.ts` 不再有 mock，全部经由 `https://youmind.com/openapi/v1/wordpress/*`
- 后端在 youapi 新增 `/openapi/v1/wordpress/*` namespace（13 端点），与 ghost/devto/qiita 平级
- WP 的图片上传走 `/wp-json/wp/v2/media`，图片落用户自己的 WP 站，**没有 cdn.gooo.ai 的 hotlink 顾虑**

## 非目标

- skill 端不直接调用 `/wp-json/wp/v2/*`（严禁）
- 不做 wordpress.com Jetpack 特有 endpoint 适配（标准 REST 通路两边都能跑）
- 不做评论、用户管理、站点设置等编辑面板能力
- 不为旧 `config.yaml` 的 `wordpress.*` 段做兼容 shim——破坏性变更，迁到 YouMind 平台是单向操作（用户决策 A）

## WordPress REST 硬约束

| 项 | 值 |
| --- | --- |
| Auth | `Authorization: Basic base64(username:appPassword)` |
| Status | `publish / draft / pending / private / future` |
| Tag/Category 引用 | **数字 ID 唯一**，名字需要先 lookup 或 createTag |
| 删除 | 默认进 trash；`?force=true` 物理删 |
| Featured image | 数字 `featured_media` ID（必须先 uploadMedia） |
| Media upload | `Content-Type: <mime>` + `Content-Disposition: attachment; filename="..."` + 原始 binary |
| 图片托管 | 用户自己的 WP 站，**对外可直接引用，无 hotlink 限制** |
| 列表分页 | `page` + `per_page` (max 100)，响应头 `X-WP-Total` / `X-WP-TotalPages` |

## 架构

### 信任边界

```text
Skill (仅持有: youmind.api_key)
    │  POST x-api-key
    ▼
YouMind 后端 (持有: 加密的 siteUrl + username + appPassword)
    │  Authorization: Basic ...
    ▼
WordPress REST (siteUrl/wp-json/wp/v2/*)
```

### 后端（youapi）—— 复刻 Qiita / Ghost 模式

**新文件：**

| 路径 | 职责 |
| --- | --- |
| `dto/openapi-wordpress-post.dto.ts` | 13 个 DTO：WordPressPostDto / WordPressMediaDto / WordPressCategoryDto / WordPressTagDto + 各自的 Create/Update/Get/Delete/List 请求 DTO |
| `services/wordpress-api.client.ts` | 低层 HTTP client：13 个 WP REST 调用 + tag-name → ID 解析 + media binary upload |
| `services/wordpress-openapi.service.ts` | 业务编排：assertPaidPlan → findBySpaceAndPlatform('wordpress') → decrypt appPassword → 委托 client |
| `controllers/openapi-wordpress.controller.ts` | 13 个 `@Post @HttpCode(200)` 路由 |

**编辑：**

- `platform-account.module.ts`：import controller、加 controllers 数组、加 client+service 到 providers

**端点契约：**

| 路由 | 关键请求字段 | 响应 |
| --- | --- | --- |
| `POST /openapi/v1/wordpress/validateConnection` | `{}` | `{ ok, message, accountId, accountName, siteUrl }` |
| `POST /openapi/v1/wordpress/createPost` | `{ title, content, status?, tags?, categories?, featuredMedia?, excerpt?, slug?, date? }` | `WordPressPostDto` |
| `POST /openapi/v1/wordpress/updatePost` | `{ id, ...optional fields }` | `WordPressPostDto` |
| `POST /openapi/v1/wordpress/getPost` | `{ id, context? }` | `WordPressPostDto` |
| `POST /openapi/v1/wordpress/deletePost` | `{ id, force? }` | `{ ok, id, deletedPermanently }` |
| `POST /openapi/v1/wordpress/listPosts` | `{ page?, perPage?, status? }` | `{ posts, total, totalPages, page, perPage }` |
| `POST /openapi/v1/wordpress/listDrafts` | `{ page?, perPage? }` | 同 listPosts，固定 status=draft |
| `POST /openapi/v1/wordpress/listPublished` | `{ page?, perPage? }` | 同 listPosts，固定 status=publish |
| `POST /openapi/v1/wordpress/publishPost` | `{ id }` | updatePost(status=publish) 的语法糖 |
| `POST /openapi/v1/wordpress/unpublishPost` | `{ id }` | updatePost(status=draft) 的语法糖 |
| `POST /openapi/v1/wordpress/uploadMedia` | `{ filename, contentBase64, contentType?, altText?, caption? }` | `WordPressMediaDto` |
| `POST /openapi/v1/wordpress/listCategories` | `{ page?, perPage?, search? }` | `{ categories, total, totalPages }` |
| `POST /openapi/v1/wordpress/listTags` | `{ page?, perPage?, search? }` | `{ tags, total, totalPages }` |

**WordPressPostDto 关键字段（驼峰，扁平化）：**
`{ id, title, content, excerpt, status, slug, link, author, featuredMedia, categories: number[], tags: number[], date, modified, format }`

**Tag/Category 名字解析（关键 UX 优化）：**
- `createPost / updatePost` 接受 `tags: string[]`（名字）+ `categories: string[]`（名字）
- 后端在 `wordpress-api.client.ts` 内部：
  - tag：`GET /tags?search={name}`，找不到 exact match → `POST /tags { name }`，回填 ID
  - category：`GET /categories?search={name}`，找不到 → 报错 `WORDPRESS_CATEGORY_NOT_FOUND`（不自动创建 category，避免站点结构污染）
- 调用端（skill）和最终用户都不需要记 WP 内部 ID

**鉴权 & 错误处理：**
- 复用 `AuthGuard` + `x-api-key`
- WP 401 → `WORDPRESS_AUTH_INVALID`，`detail.reconnectUrl` 指向 YouMind 绑定页
- WP 403 → `WORDPRESS_FORBIDDEN`
- WP 404 → `WORDPRESS_NOT_FOUND`
- 其他 → `WORDPRESS_UPSTREAM_ERROR` 透传 `detail.upstreamMessage`

### Skill 端（youmind-wordpress-article）

**重写：**
- `toolkit/src/wordpress-api.ts`：去 mock，按 `qiita-api.ts` 模式实现 13 个真实 fetch 调用，类型保持稳定
- `toolkit/src/cli.ts`：现有 5 命令（publish/preview/validate/list/upload-media）扩到 12 条，对齐 Ghost CLI 颗粒度
- `toolkit/src/publisher.ts`：去掉 mock 的 tag/category ID resolve 逻辑，直接传名字
- `toolkit/src/content-adapter.ts`：去掉 mock 的 createTag 调用，仅保留 markdown→HTML + excerpt 生成

**编辑：**
- `config.yaml` + `config.example.yaml`：**删 `wordpress.*` 段**（破坏性）
- `references/api-reference.md`：全量重写为 YouMind `/wordpress/*` 契约
- `SKILL.md`：setup 步骤 4 改成"在 YouMind 平台绑 WordPress"
- `README.md` / `README_CN.md`：同步绑定流程说明

**保留不动：**
- `toolkit/src/youmind-api.ts`
- `references/pipeline.md` / `references/content-adaptation.md`

**编译：** `cd toolkit && npm install && npm run build`

## 取舍说明

**为何后端做 tag-name 解析而不让 skill 做？**
WP tag 名字解析是平台层职责（每个 WP 站自己的 tag 字典），让 skill 去管两次 round-trip + 缓存策略是过度耦合。后端在单个 createPost 请求内顺序解析 5 个 tag 也就 5 次额外 HTTP，可接受。

**为何 category 不自动创建？**
WP category 通常代表站点信息架构，由站长设计。skill 自动创建会污染分类树。tag 是 free-form 标签，自动创建符合直觉。

**为何破坏性删 wordpress.* config？**
single source of truth。两处都填会引入"哪个优先"的歧义，给未来调试埋雷。用户确认 A 选项。

**为何不做 publishPost / unpublishPost 的独立 client 方法？**
WP 没有专门的 transition endpoint，本质就是 update status，client 内部直接复用 update。controller 暴露独立路由是 UX 友好（cli 命令更清晰），不是技术必须。

## 测试计划

后端：
- 跑 `pnpm tsc --noEmit -p tsconfig.build.json` 保证编译通过
- localhost:4000 起服务，curl 验证 13 端点（特别测 tag name 解析的 happy/missing/duplicate-name 路径）

Skill：
- `node dist/cli.js validate` → 期望返回 ok + 用户名
- `node dist/cli.js publish output/test.md --status draft --categories "Tech" --tags "AI,YouMind"` → 拿到 url
- `node dist/cli.js upload-media local.png` → 拿到 source_url
- `node dist/cli.js publish-post <id>` / `unpublish-post <id>` / `list-drafts` / `delete <id>` 全链路跑通

## 影响面

- youapi 新增 4 文件 + 1 module 编辑
- skill 重写 1 文件、扩展 1 文件、简化 2 文件、改 5 文档/config 文件
- **破坏性**：旧 `config.yaml` 的 `wordpress.*` 段失效——用户必须迁到 YouMind 平台绑定（README 会写明）
- 不影响其他平台 skill 或后端模块

## 落地顺序

1. 后端先落（DTO → Client → Service → Controller → Module 注册 → tsc 验证）
2. skill 重写 wordpress-api.ts + cli.ts + publisher.ts + content-adapter.ts
3. 改 config + 文档（破坏性变更同步说明）
4. 编译 dist + 联调
5. 双轨 commit
