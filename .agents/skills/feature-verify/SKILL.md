---
name: feature-verify
description: Verifies changes in this repo — the check gate (bun run check), DB setup, booting the API/app, and driving the API over HTTP (curl probes, the { code, message, fields } error shape, validation failures). Use after implementing ANY feature, whenever the user asks "is it working / confirm this fix / why does the API fail", when a check fails and you need to reproduce the behavior, or when confirming a fix against a live server. Static checks passing ≠ behavior correct — this skill takes verification down to the HTTP layer.
---

# Verify（验证改动）

分层验证：**静态检查 → 数据库 → 启动 → HTTP 驱动**。每层都过了才算完成。用户在实现一个 feature 之后（或调试/确认修复时）应走到第 4 层——静态检查通过 ≠ 行为正确。

> **本 skill 验证的是 API 契约**（响应形状、错误码、时区/批量语义）。前端行为——服务器错误落进表单字段、`key` 重挂载、勾选跨 refetch 存活、对话框流程——靠打开 app 手工走一遍（或让用户走），本 skill 不替代它。API 契约对 = 前端能收到的数据形状对，这是 UI 行为的前提。
>
> **闭环**：用 `feature` skill（渐进式披露，参考文件 per 阶段）构建的改动，全部做完后跑本 skill 收尾。

## L0 · 静态检查（最快，先跑）

```bash
bun run check        # 唯一门禁：先 tsr generate 再 vp check（app + api + packages）
bun run check:fix    # 自动修复格式/lint 问题
```

`bun run check` 内部（`scripts/check.ts`）：

1. `bunx tsr generate` —— 重新生成 `app/src/routeTree.gen.ts`（新增路由文件后必须跑，否则新路由在类型检查和运行时都不存在；`bun dev` 也会自动生成，但 check 保证 CI/命令行场景不缺）。
2. `bunx vp check app api packages` —— vite-plus 检查：format + lint（**type-aware** + type-check 全开）+ tsc。它覆盖：
    - `api/src` 的 `no-restricted-properties`（直接碰 `process.env`/`Bun.env` 报错——必须走集中式 `env.ts`）
    - `app/src` 的 `no-restricted-imports`（运行时 import `@api/*` 报错——app 只能 type-import API）

检查失败时：先看是不是 `routeTree.gen.ts` 过期（重跑 `check`）；再看 lint 错误的具体规则；`--fix` 能修格式类问题，但 type-check 和架构规则必须手改。

## L1 · 数据库

```bash
docker compose up -d        # Postgres 17 on 5432（若 5432 已被别的项目占用，检查 DATABASE_URL 指向即可，可复用）
cd api && cp .env.example .env   # DATABASE_URL 必需——env.ts 缺它直接 throw
cd api && bun run db:migrate # 应用版本化迁移（schema.ts 是唯一事实源；首次跑自动建表）
cd api && bun run db:studio # 可视化检查数据
```

坑：`db:migrate` 失败通常是 Postgres 没起或 DATABASE_URL 错。改了 `schema.ts` 后必须先 `db:generate` 再 `db:migrate`，否则运行时查不到新列。

## L2 · 启动

```bash
bun dev                     # api (:3000) + app (:5173)
```

- API 单独起：`cd api && bun src/main.ts`（`bun run start`）——**无 watch**，改代码要重启。
- `bun run dev` 的 api 进程是 `cd .. && bun --watch --env-file=api/.env api/src/main.ts`：Bun 只 watch 进程 cwd，所以 script 先跳仓库根——否则 `packages/shared` 的改动既不被 watch 也不触发重启。**改了 shared 契约要确认 API 已重启。**
- 启动后检查：API 打 `http://localhost:3000/api`（404 `{ code: 'NOT_FOUND' }` 也算活着——证明 onError 管线在工作）；app 开 `http://localhost:5173`。
- **OpenAPI 文档**：`GET http://localhost:3000/api/docs` —— 全部端点 + 请求/响应 schema（来自 shared 契约），调试前先看它确认参数名。

## L3 · HTTP 驱动（curl 探测）

所有错误响应都是同一形状 `{ code, message, fields? }`（统一错误管线，见 AGENTS.md）。验证 = 确认**成功路径返回预期形状 + 失败路径返回正确 code**。

> 下面的示例都用 users 资源——换成你正在验证的资源路径/字段/消息（如 `/products`、`price`、`'Product not found'`）。

```bash
# 0) 先拿 token——/users 全部端点需要 Authorization，漏了会得到 401（探测失误，不是 bug）。
#    注册（密码 ≥8 字符）；邮箱已存在时改用 login。
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Verify Operator","email":"operator@example.com","password":"v3ry-Secret"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)
AUTH="Authorization: Bearer $TOKEN"

# 成功：列表（注意 URL 里的 ? 要用引号包住）
curl -H "$AUTH" "http://localhost:3000/api/users?page=1&pageSize=5"

# 成功：创建 → 记住返回的 id 和 email（创建的也是真实可登录的用户）
curl -X POST http://localhost:3000/api/users \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"Verify Tester","email":"tester@example.com","password":"v3ry-Secret"}'

# 失败路径逐一验证（这是统一错误管线的验收）：
curl -H "$AUTH" http://localhost:3000/api/users/99999
# → 404 { "code": "NOT_FOUND", "message": "User not found" }

curl -X POST http://localhost:3000/api/users \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":""}'          # 缺 email、缺 password、空 name
# → 422 { "code": "VALIDATION", "fields": [{ "field": "email", ... }, { "field": "password", ... }] }

curl -X POST http://localhost:3000/api/users \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"Verify Tester","email":"tester@example.com","password":"v3ry-Secret"}'
# → 409 { "code": "CONFLICT", "message": "This email is already registered" }（唯一约束）

# 批量删除：删掉刚才的测试数据（成功路径）
curl -X POST http://localhost:3000/api/users/batch-delete \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"ids":[<上面返回的 id>]}'
# → { "deleted": 1 }
```

验证要点（与共享契约一一对应）：

- 响应字段形状必须与 `packages/shared/src/api/<resource>/` 的响应 schema 完全一致（Eden 客户端类型由它推导——**前端看到的形状就是这里校验的形状**）。
- 时间戳是 RFC 3339 UTC 字符串（`2024-01-14T16:00:00.000Z`），不是 Date 序列化。
- 列表过滤用 `search`；日期过滤是 HALF-OPEN 的 `createdRange:{from,to}`（ISO datetime）——客户端把 "to 所选日之后那个凌晨" 提交为区间终点，服务端 `lt` 比较，不猜时区。
- 批量删除语义：不存在的 id **静默跳过**（`deleted` 计数少，不是 4xx）——单条删除才是 404。

## 已知坑位（这个仓库特有的）

- **改 shared 契约后**：API 要重启（L2 的 watch 行为）+ `bun run check` 重新过（类型全链路会立刻暴露契约不匹配）。前端 Eden 客户端类型来自 API 响应 schema——契约改了，前端编译错误就是最快的验证信号。
- **错误码只增不删**：新错误码 = 改 `packages/shared/src/error` 的 `ERROR_DEFAULTS` 一处（status + 默认 message），两侧跟随。验证时确认新 code 的 status/message 与默认值一致（如 `CONFLICT` → 409）。

## 自检清单

- [ ] `bun run check` 通过（含 tsr generate 环节）
- [ ] `db:generate` + `db:migrate` 后 schema 与 DB 同步（改过 schema 的话）
- [ ] API 活着（`/api/docs` 可访问），app 可打开
- [ ] 新端点的成功路径 curl 返回预期形状（对照 shared 响应 schema）
- [ ] 新端点的失败路径返回正确 code（404/409/422 + fields）
- [ ] 测试数据已清理（创建/批量删除的临时数据不留在库里）
