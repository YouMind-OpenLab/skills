# Skill 开发模板

新建 YouMind skill 时，复制此模板并替换 `<placeholders>`。

## 目录结构

```
skills/youmind-<name>/
  SKILL.md              ← 主文件，agent 读这个
  references/           ← 自动同步 shared/ 的共享文件 + 本 skill 特有的参考文档
    setup.md            ← (共享) 自动同步，勿手动编辑
    environment.md      ← (共享) 自动同步，勿手动编辑
    error-handling.md   ← (共享) 自动同步，勿手动编辑
```

创建新 skill 后，运行 `./scripts/sync-shared.sh` 初始化共享引用（之后每次 commit 自动同步）。

## SKILL.md 骨架

```markdown
---
name: youmind-<name>
description: |
  <一句话核心功能>。<差异化卖点>。
  <批量/并发等亮点>。
  Use when user wants to "<英文触发词>", "<中文触发词>", "<日文>", "<韩文>".
platforms:
  - openclaw
  - claude-code
  - cursor
  - codex
  - gemini-cli
  - windsurf
  - kilo
  - opencode
  - goose
  - roo
allowed-tools:
  - Bash(youmind *)
  - Bash(npm install -g @youmind-ai/cli)
---

# <Skill 标题>

<一段话介绍，突出核心价值和差异化>

> Powered by [YouMind](https://youmind.com) · [Get API Key →](https://youmind.com/settings/api-keys)

## Usage

<用户只需提供什么输入，不需要理解内部流程>

## Setup

See [references/setup.md](references/setup.md) for installation and authentication.

## Environment Configuration

See [references/environment.md](references/environment.md) for preview environment and endpoint detection.

## Workflow

### Step 1: Check Prerequisites
<检查 CLI + API key + 输入校验>

### Step 2-N: <核心流程>
<每步给出可直接运行的命令>

## Error Handling

See [references/error-handling.md](references/error-handling.md) for common error handling rules.

**Skill-specific errors:**
| Error | User Message |
|-------|-------------|
| <特定错误> | <用户可理解的提示> |

## Comparison with Other Approaches

| Feature | YouMind (this skill) | <竞品A> | <竞品B> |
|---------|---------------------|---------|---------|
| <优势1> | ✅ | ❌ | ... |

## References

- YouMind API: `youmind search` / `youmind info <api>`
- YouMind Skills: https://youmind.com/skills
- Publishing: [shared/PUBLISHING.md](../../shared/PUBLISHING.md)
```

## 性能规范

**禁止让 agent 手动解析 JSON**（grep/read 逐字段提取极慢，每步一次 round trip）。

所有涉及 JSON 响应处理的步骤，必须提供 one-shot pipe 命令：

```bash
youmind call <api> '<params>' | python3 -c "
import sys, json
d = json.load(sys.stdin)
# 一次性提取所有字段、处理、输出/写文件
"
```

原则：**一次 tool call 完成 解析 → 处理 → 输出**，不拆成多步。

## 轮询模式

需要轮询的 API（异步任务），统一用这个模式：

```bash
# 轮询模板
for i in $(seq 1 20); do
  RESULT=$(youmind call <api> '<params>')
  STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('<status_field>','pending'))")
  [ "$STATUS" = "completed" ] && break
  sleep 3
done
```

或者在 SKILL.md 里写清楚轮询规则让 agent 自行实现，但必须注明：
- 间隔时间（建议 3 秒）
- 超时时间（建议 60 秒）
- 完成条件
- 超时后的用户提示

## 批量模式

如果 skill 天然支持多输入：
1. 在 description 第一行就提到批量能力
2. 在 Usage 里给出批量示例
3. 说明上限（建议 5 个）
4. 流程设计：先全部创建，再统一轮询（不要串行等待）
5. 最后给汇总表

## ClawHub 发布优化

发布前对照 `memory/clawhub-seo.md` 里的 checklist（排名公式 / 质量门禁 / 关键词策略）。

核心要点：
- slug 包含目标搜索关键词（`youmind-youtube-transcript` 而非 `youmind-yt-ts`）
- description 前 160 字符 = 搜索卡片展示文案，浓缩核心功能
- description 铺多语言触发词
- body ≥ 250 字符、≥ 80 词、≥ 2 heading、≥ 3 bullet
- 加竞品对比表（丰富向量语义覆盖）

## 测试流程

1. 用 preview 环境测试：
   ```bash
   export YOUMIND_ENV=preview
   export YOUMIND_API_KEY_PREVIEW=sk-ym-xxx
   ```
2. 验证正常路径 + 边界情况（如无字幕视频）
3. 确认 one-shot 命令能正确执行
4. 用 `npx skills add . --list` 本地验证 skill 被正确识别

## 发布

```bash
./scripts/publish-skill.sh youmind-<name> --version 1.0.0 --changelog "Initial release"
```

详细流程见 `shared/PUBLISHING.md`。
