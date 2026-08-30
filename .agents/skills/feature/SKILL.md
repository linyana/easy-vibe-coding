---
name: feature
description: Builds a full-stack feature in this repo — the accounts canonical pattern, one pipeline from contract to route. Covers brand-new resource scaffolding (shared contract base, Drizzle table, API module, page skeleton), server-side list pages (search/filter/pagination/selection), create/edit forms, and delete/remove flows (single, batch, type-to-confirm). Use whenever the user asks for a feature that lists, creates, edits, or deletes records — a table, a form, a dialog, a CRUD page (products, orders, …) — or to extend an existing one, even if they don't say "feature". It uses progressive disclosure — read patterns.md first, then only the reference file for the step you are on (scaffold/list/form/remove). Verification lives in the separate feature-verify skill.
---

# Feature（全流程：脚手架 → 列表 → 写操作 → 编排）

accounts 是唯一 canonical 模块，本 skill 是它的完整流水线。**先读 `patterns.md`（共享约定与边界条件），再只读当前这一步对应的参考文件**；做到下一步再读下一个。渐进式披露——不用的文件不读。

## 路由表（做什么 → 读哪个文件）

| 场景                                              | 读                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| 开始任何 feature（第一次）                        | `references/patterns.md`（先读一遍）                                        |
| 资源文件夹还不存在（products/orders… 第一次出现） | `references/scaffold.md`                                                    |
| 做/改列表（search / 过滤器 / 分页 / 多选入口）    | `references/list.md`                                                        |
| 做/改创建、编辑表单                               | `references/form.md`                                                        |
| 做/改删除（单条 / 批量）、页面编排                | `references/remove.md`                                                      |
| settings 型功能（get/set，canonical 原型未做）    | `references/form.md` + `patterns.md`；做成后沉淀为 `references/settings.md` |
| 验证改动（check / DB / 启动 / curl）              | **feature-verify**（独立 skill）                                            |

流程顺序：scaffold → list → form → remove → feature-verify。写操作按需只读 form.md 或 remove.md。

## 命名（一个资源四个形式，全仓库一致）

| 形式       | 例子            | 用在哪                                                                       |
| ---------- | --------------- | ---------------------------------------------------------------------------- |
| `products` | 复数小写        | 表名、`api/src/modules/` 文件夹、路由路径、`packages/shared/src/api/` 文件夹 |
| `product`  | 单数小写        | schema 命名前缀（`productResponseSchema`）、service 方法内变量               |
| `Product`  | PascalCase 单数 | 实体类型名                                                                   |
| `Products` | PascalCase 复数 | controller 导出名、openapi `tags`、页面组件名、`pages/` 文件夹名             |

> 换资源时把四个形式一起替换，其余照抄。示例资源统一用 `Product`（字段 name + price + createdAt）。

## 什么是结构、什么是资源专属

- **结构**（照抄）：文件清单、流程顺序、共享层职责、边界语义（half-open 日期、无缓存、页码钳制、selection、type-to-confirm）。
- **资源专属**（为你的资源选，不照抄）：搜索字段、表格列、过滤器、表单字段。accounts 搜 name+email 是因为账号有 email；Product 没有 email，别给 product 搜 email。

## 红线速记（完整版见 AGENTS.md）

- 不手改 `app/src/routeTree.gen.ts`——`bun dev` 和 `bun run check` 都会先重新生成它（tsr generate）。
- `routes/` 只接线；业务代码永远进 `pages/`。
- `app` 只 type-import `api`；`api` 永不 import `app`。
- **规则永不镜像**：响应形状、校验规则、错误码只定义在 `packages/shared` 一处。
- 时间戳是 RFC 3339 UTC 字符串，无 per-query 转换。
- 不新建 `core/`、不重命名 `pages/`。

## 一个 feature 完成后的产出树

```text
packages/shared/src/api/products/
  shared/index.ts        # 契约基座：响应 schema + id params + success（scaffold）
  list/index.ts          # 列表 query + 响应（list）
  create/index.ts        # 字段规则基座 + create 请求（form）
  edit/index.ts          # partial 更新（form）
  delete/index.ts        # 单条删除（remove）
  batch-delete/index.ts  # 批量删除（remove）
  index.ts               # re-export 集合（每步追加一行）
api/src/db/schema.ts            # products 表（scaffold）
api/src/modules/products/       # controller.ts（各步追加端点）· service.ts（各步加方法）
api/src/main.ts                 # 挂载 + openapi tag（scaffold）
app/src/pages/Products/
  types/index.ts         # 实体类型 + 动作词汇（scaffold 起步，各步扩展）
  List/                  # 列表行为 + columns + 过滤器（list）
  Create/ · Edit/        # 表单对话框（form）
  Delete/ (+batch-dialog.tsx)   # 删除对话框（remove）
  index.tsx              # 编排（remove 的最后一步）
app/src/pages/index.ts          # 追加 export（scaffold）
app/src/routes/products.tsx     # 路由接线（scaffold）
```

## 自检

每阶段参考文件尾部有该阶段的自检清单；全部完成后跑 **feature-verify**（check → DB → 启动 → curl 成功/失败路径）。
