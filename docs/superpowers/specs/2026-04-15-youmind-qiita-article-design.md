# YouMind Qiita 文章 Skill 设计

## 问题背景

`youmind-qiita-article` skill 已有完整骨架（SKILL.md、references/、toolkit/src/），但 `qiita-api.ts` 是 mock 实现，6 个核心操作里只有创建走得通真实路径，且 YouMind 后端只暴露了 `createTokenPlatformPost` 一个通用端点，没有 Qiita 专用的 CRUD 命名空间。

对比 ghost-article（10+ 专用端点 / 完整 CRUD / dist 已编译），Qiita skill 当前是"假能用"。

## 目标

- 用户只配置 `youmind.api_key` + 在 YouMind 平台绑定 Qiita token，skill 即可完成 Qiita 文章全生命周期管理（创建 / 读取 / 更新 / 列表 / 删除 / 验证连接）
- skill 端的 `qiita-api.ts` 不再有 mock，全部通过 `https://youmind.com/openapi/v1/qiita/*` 端点出去
- 后端在 youapi 新增 `/openapi/v1/qiita/*` 命名空间，与 devto / ghost 平级
- 对齐 devto 的最新落地模式（commit `a34cca3`），不发明新风格

## 非目标

- 不直接调用 `qiita.com/api/v2/*`（skill 严禁）
- 不实现 Qiita "草稿" 概念 —— Qiita 没有 draft，只有 `private: boolean`
- 不做图片上传 —— Qiita REST v2 无图片上传 API
- 不做 publishPost / unpublishPost —— Qiita 文章是即时发布的，不存在草稿态，私密 ↔ 公开通过 `updateItem` 切 `private` 字段实现
- 不做组织（organization）发布 —— Qiita Team 功能延后
- 不动 token 绑定流程 —— `saveTokenCredentials` 已支持 `platform: qiita`，复用即可

## Qiita API v2 硬约束

| 项 | 值 |
| --- | --- |
| Auth | `Authorization: Bearer <token>` |
| Rate limit | 1000 req/hr（已认证） |
| Tags | `{ name: string, versions: string[] }`，**最多 5 个** |
| 草稿 | 不支持，只有 `private: boolean` |
| 图片上传 | REST v2 无 |
| 标题/正文 | Markdown body，title 必填 |
| 列表分页 | `page` (1-100, default 1) + `per_page` (1-100, default 20) |

## 架构

### 信任边界

```text
Skill (仅持有: youmind.api_key)
    │  POST x-api-key
    ▼
YouMind 后端 (持有: 加密的 Qiita token，按 spaceId 解密)
    │  Bearer <token>
    ▼
Qiita API v2 (qiita.com/api/v2/*)
```

### 后端（youapi）—— 复刻 devto 模式

**新文件：**

| 路径 | 职责 |
| --- | --- |
| `src/modules/platform-account/dto/openapi-qiita-item.dto.ts` | 6 个 DTO：QiitaItemDto（响应）+ Create/Update/Get/Delete/ListMyItems/ValidateConnection 请求 DTO |
| `src/modules/platform-account/services/qiita-api.client.ts` | 低层 HTTP client，封装 6 个 Qiita REST 调用（authenticated_user / items CRUD / list） |
| `src/modules/platform-account/services/qiita-openapi.service.ts` | 业务编排：assertPaidPlan → findBySpaceAndPlatform('qiita') → decrypt accessToken → 委托 client |
| `src/modules/platform-account/controllers/openapi-qiita.controller.ts` | 6 个 `@Post @HttpCode(200)` 路由 |

**编辑：**

- `src/modules/platform-account/platform-account.module.ts`：import controller、加 controllers 数组、加 client+service 到 providers

**端点契约：**

| 路由 | 请求 | 响应 |
| --- | --- | --- |
| `POST /openapi/v1/qiita/validateConnection` | `{}` | `{ ok, message, accountId, accountName, profileImageUrl }` |
| `POST /openapi/v1/qiita/createItem` | `{ title, body, tags?, private?, tweet?, slide? }` | `QiitaItemDto` |
| `POST /openapi/v1/qiita/updateItem` | `{ id, title?, body?, tags?, private? }` | `QiitaItemDto` |
| `POST /openapi/v1/qiita/getItem` | `{ id }` | `QiitaItemDto` |
| `POST /openapi/v1/qiita/listMyItems` | `{ page?, per_page? }` | `{ items: QiitaItemDto[], total: number }` |
| `POST /openapi/v1/qiita/deleteItem` | `{ id }` | `{ ok: true, id }` |

`QiitaItemDto`：`{ id, title, body, renderedBody, tags: [{name, versions}], private, url, createdAt, updatedAt, likesCount, stocksCount, commentsCount, user: { id, name, profileImageUrl } }`

**鉴权：** 复用 `AuthGuard` + `x-api-key` header，与 devto/ghost 一致。

**Token 解密：** 复用 `SecretsService.decrypt(credentials.accessTokenEncrypted)`，模式抄 `devto-openapi.service.ts:108-129` 的 `getApiKey(spaceId)`。

**错误处理：**
- Qiita 返回 401 → `BadRequestException` 提示 token 无效，`reconnectUrl` 指向 YouMind 平台绑定页
- Qiita 返回 403 → 权限不足（非 owner）
- Qiita 返回 404 → `NotFoundException`
- Qiita 返回 429 → 透传 `Retry-After`

### Skill 端（youmind-qiita-article）

**重写：**

- `toolkit/src/qiita-api.ts`：移除 mock state，按 `ghost-api.ts` 的 `postJson<T>` 模式实现 6 个真实调用，类型保持稳定（`QiitaConfig / QiitaTag / QiitaItem / CreateItemOptions / UpdateItemOptions`）
- `toolkit/src/cli.ts`：在现有 `publish / preview / validate / list` 基础上新增 `get <id>` / `update <id>` / `delete <id>` / `set-private <id>` / `set-public <id>`（后两个本质是 `updateItem` 的语法糖）

**编辑：**

- `config.yaml`：修注释 "YouMind Hashnode Skill Configuration" → "YouMind Qiita Skill Configuration"
- `references/api-reference.md`：把 Qiita REST 文档替换成 YouMind `/qiita/*` 端点契约（用户视角看到的是 YouMind 端点，不是 Qiita）
- `toolkit/src/publisher.ts`：微调以匹配新 `createItem` 签名（基本不变）

**保留不动：**

- `SKILL.md` / `references/pipeline.md` / `references/content-adaptation.md` / `toolkit/src/youmind-api.ts` / `toolkit/src/content-adapter.ts`

**编译：** `cd toolkit && npm install && npm run build` 产出 `dist/`

## 取舍说明

**为何不只用 generic `createTokenPlatformPost`？**
单个端点支撑不了 list/get/update/delete/validate 五个操作，CLI 体验会缺胳膊少腿。devto 同样选了专用命名空间，与之对齐。

**为何不在 skill 侧继续 mock 不存在的端点？**
用户的 memory `feedback_mock_unbuilt_apis.md` 适用于"用户拥有的后端短期内没法做"的场景。当前用户就是 YouMind 开发者，后端可以同步落，无理由保留 mock。

**为何 Qiita 没 publish/unpublish？**
Qiita 文章发布即公开，没有 draft → published 状态机。"私密阅读"是 `private: true`，本质属于 update，不需要单独路由。

## 测试计划

后端：
- 单元测试不强求（devto 现状也没单测）。手工跑 `pnpm tsc --noEmit` 保证编译通过。
- 启动本地 youapi（端口 4000），用 curl 验证 6 个端点：validate → create → get → update（切 private）→ list → delete

Skill：
- `node dist/cli.js validate` → 期望返回 ok + Qiita 用户名
- `node dist/cli.js publish output/test.md --tags ruby,test` → 拿到 url
- `node dist/cli.js get <id>` / `list` / `set-private <id>` / `delete <id>` 全跑通

## 影响面

- youapi 新增 4 文件 + 1 编辑（platform-account.module.ts）
- skill 重写 1 文件（qiita-api.ts）+ 编辑 3 文件（cli.ts / config.yaml / api-reference.md）
- 不影响其他平台 skill 或后端模块

## 落地顺序

1. 后端先落（DTO → Client → Service → Controller → Module 注册 → tsc 验证）
2. skill 重写 qiita-api.ts + cli.ts
3. 修 config + 文档
4. 编译 dist + 联调
