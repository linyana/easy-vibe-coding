# AGENTS.md（AI 手册）

## 这是什么

`easy-vibe-coding` 是一个**为 AI 辅助开发（"vibe coding"）而生**的全栈 starter。

工作流：用户用自然语言描述一个功能 —— _"我想要一个带搜索、分页和编辑页的产品列表"_ —— AI 用系统预建的组件和可复制的模式端到端实现它，用户只审查 AI 写的功能代码。基础设施（数据层、auth、主题、错误处理、组件库）是**被使用**的，不是被重写的。

## 工作原则

- **AI 是生成者。** 没有 CLI 脚手架、没有 JSON 配置。仓库本身就是手册：一套组件词汇表 + 覆盖常见原型（列表、表单/编辑、详情、auth）的范例功能。AI 复制模式并适配 —— 不发明新结构。
- **审查面 = 功能代码。** AI 写的每一行都是用户的审查成本。组件存在的意义就是把审查面压到最小。
- **类型是安全网。** 全链路端到端类型安全（API 侧 Elysia + Eden + Drizzle）把错误变成编译错误，让"复制-适配"工作流可靠。
- **扩展系统是常态。** 默认使用现有 hooks/组件；用例覆盖不到时，**就地扩展**（in place），不要绕开它另起炉灶。当共享基础设施被改动时，在你的总结里注明。
- **注释和文档只记长期契约。** 一次性决策（数据迁移、临时修复、一次性回填、环境特有的坑）只留在当时的总结里——不写代码注释、不更新 AGENTS.md；它们不会长期成立，写了就是未来的误导。只有长期成立的约定（边界条件、设计意图、schema 语义、架构红线）才值得进注释和文档。
- **注释只写代码表达不了的信息。** 代码能自证的内容（标识符、控制流、显而易见的意图）不写注释——复述代码的注释是噪音，白增审查面。注释解释"为什么"（设计意图、权衡、边界、非显而易见的不变量），不解释"是什么"。**叙事类注释同样是噪音**：描述可见机制、复述可推断理由的"为什么"（如 type-to-confirm 的目的、组件职责分工）删掉不丢信息——机制在代码里，理由从机制能推断。判定用防错测试：**删掉这行注释，未来 AI 是否更可能犯错**（bug / 安全回归 / 破坏消费方 / 架构漂移）？不会，它就不该存在。例外只有两类：**缺席决策**（代码里看不见"故意没有"的东西——如没有错误文案、不自动重试）和**跨文件契约**（别的文件消费这个值）。
- **简即是繁，上下文是成本。** 文档与注释的每一行都是每次任务的固定上下文成本，只有「代码读不出来 × 长期成立」的信息才配付。AI 一查就有的不写：名字扫目录、行为读代码、职责看文件头注释。**枚举注定腐烂**——名字清单、状态快照、`（done）` 标记从写下那刻就开始偏离代码；过期的文档比没有更糟，AI 会信注释被带偏。删旧档和删旧码一样是维护。
- **前沿工具，未来标准。** 依赖和语法瞄准当前标准，绝不用最低公分母。本项目跑 TypeScript 7（原生编译器）、Bun、TS-go linter、TanStack Table v9 —— 用 v9 的 `useTable`/features API，不用废弃的 v8 兼容 `legacy` 入口。
- **简单的功能，明确的边界。** 功能保持最小 —— 但边界条件想清楚。一个带显式边界处理的小表面，胜过藏着隐式状态的大表面。

## 红线清单（禁止项，任何任务都可能踩）

1. **不手改 `app/src/routeTree.gen.ts`** —— 它是生成的。`bun dev` 和 `bun run check` 都会先重新生成它。
2. **`app/src/routes/` 只做接线**：一个文件只有 `createFileRoute`（+ 仅当路由读 URL 参数时的 `validateSearch`）和页面 re-export。业务代码放 `pages/`，永远不进 `routes/`。（`__root.tsx` 是唯一例外。）
3. **`app` 只能 type-import `api`**（`import type { App } from '@api/main'`，lint 强制）—— Bun 专属的运行时 API 代码绝不能打包进浏览器。`api` 永不 import `app`。
4. **不发明 per-feature 包装 hook。** 读用 `useAPIQuery`/`useAPIList`，写用 `useAPIMutation`/`useForm`。共享 hook 覆盖不到的用例，**就地扩展那个 hook**。
5. **规则永不镜像。** 校验规则、响应形状、错误码都定义在 `packages/shared` 一处。表单校验用共享 schema（`useForm({ schema })`），字段错误显示走 `errors[name]`。
6. **错误只能走统一管线。** API 侧业务代码永不返回错误、永不手动 `set.status` —— 抛 `Errors.*` / `ApiError`，由 `main.ts` 的 `onError` 统一归一化。App 侧永远不碰 Eden 的 `{ data, error }` 信封。
7. **列表过滤状态在组件内存里**（`useState`，经 `useAPIList`），不进 URL。URL 保持干净；不要给列表路由加 `validateSearch`。
8. **线上时间戳是 RFC 3339 UTC 字符串**（`z.iso.datetime()` / `timestamptz`），不是 `Date` 对象。一切 instant ↔ 本地日历日转换都收敛在 `app/src/libs/dates`，服务端永不猜时区。
9. **Postgres 连接池叫 `pool`**，永不叫 `queryClient` —— 那个名字属于 app 侧的 TanStack Query。
10. **不新建 `core/`**（用户模块就叫 `modules/`，admin 模块归 `modules/admin/`——作用域是唯一分组轴，"core" 是模糊概念且与 `libs/` 撞车），不重命名 `app/src/pages`。`modules/`（API）和 `pages/`（UI）是两侧各自的概念名。
11. **组件间 import 用精确子路径**（`@/components/data`、`@/components/ui/button`），顶层 barrel `@/components` 只给消费者用。`ui/` 无 barrel，直接按文件路径导入。

## 新增一个 feature 的标准工作流

> 参照范例：`accounts`（唯一 canonical 模块）。**深度细节、可复制代码、边界条件都在 skills 里**（见文末 Skills 表）——动手前先加载对应 skill，本文档只给骨架。**任何 feature 工作只加载一个 `feature` skill**（渐进式披露）：先读它的 patterns 参考文件，再按 SKILL.md 里的路由表读当前步骤对应的文件（新资源 → scaffold）。

```text
1. 契约层  packages/shared/src/api/<resource>/<endpoint>/   每端点一文件夹一 index.ts（请求+响应 zod schema）
2. API 层  api/src/modules/<name>/（admin 作用域的 feature 用 api/src/modules/admin/<name>/）  controller 只接线（schema 全从 shared 导入）· service 写逻辑（抛 Errors）· main.ts 挂载
3. 页面类型 app/src/pages/<name>/types/  实体类型 = UseAPIItem<typeof API.x.get>（推导，不手写）· action 词汇 = union
4. 行为模块 app/src/pages/<name>/<Behavior>/  List/（useAPIList+ListTable）· Create/、Edit/（useForm+Dialog+Form 组合）· Delete/（useAPIMutation+RemoveDialog）
5. 编排      index.tsx  只管"哪个对话框开着、为谁开"，按 action.kind 分支；Edit/Delete 用 key={...} 重挂载
6. 路由      routes/<name>.tsx  createFileRoute + 页面 re-export（列表不加 validateSearch）
7. 验证      bun run check → 起服务 curl 探测成功/失败路径
```

## 目录词汇表

文件夹名就是手册的目录 —— 一个概念、一个名字，跨边界两侧一致。AI 照抄这些名字，不发明新的。

### 命名规则

- **组/分类文件夹一律 lowercase camelCase**（`hooks/useAPIList`、`libs/queryClient`、`components/data`、`components/form/dateInput`）—— 装一组东西的文件夹是"组"。
- **镜像单个导出组件的文件夹是 PascalCase** —— 文件夹就是组件，名字即导出名（`pages/<name>/<Behavior>/` 的 `List`、`DateRangeFilter`；组件的 `components/dialog/Dialog`、`components/form/FormField`、`components/data/Header`）。
- **共享代码一律 `libs/`（复数）**，每模块一个文件夹 + `index.ts` re-export（文件夹 + index.ts 形态是两侧的偏好约定）。`libs/` 是刻意的，区别于 shadcn 默认的 `lib/`（`app/components.json` 的别名已改）。

### 结构总览

```text
packages/shared/src/      契约包（跨边界唯一事实源）
  api/<resource>/<endpoint>/  每个端点一个文件夹：请求 + 响应 zod schema
  error/                  错误码 + ERROR_DEFAULTS
  constants/              两侧共享的应用标识

api/src/
  modules/<name>/   controller.ts（路由 + 校验接线）· service.ts（逻辑）—— 用户级（workspace/会话作用域）
  modules/admin/<name>/  platform 级模块子命名空间：整块 `admin: true` 守卫（如 accounts、workspaces 的 /admin* 端点）
  libs/<name>/      error/（统一错误管线）· dbError/（PG 错误码判断）
  db/               schema.ts（数据层唯一事实源）· client.ts（pool + drizzle）
  env.ts            集中式 ENV（lint 强制唯一入口）
  main.ts           装配 + 唯一 onError 归一化点

app/src/
  pages/<name>/     index.tsx（编排）· <Behavior>/（自包含行为模块）· types/
  routes/           薄接线层（红线 2）
  libs/             api/（Eden 客户端 + callEden）· dates/（时区边界）· error/ · icons/ · queryClient/ · utils/
  hooks/            读/写/表单/会话/全局状态/主题/页头 hooks —— 职责见各自文件头注释
  components/       顶层 barrel + 分类子文件夹
```

## 契约包与两侧词汇（索引：一句话职责；深度细节在 skill）

### `packages/shared`（跨边界唯一事实源）

- 错误：wire 形状 `{ code, message, fields }` + `ERROR_DEFAULTS`（每个 code 的 status + 默认 message 一处定义，两侧跟随——**加错误码 = 改一处**）。
- 端点：每端点一文件夹的请求 + 响应 zod schema。API 直接校验（Elysia 支持 Standard Schema）；app 复用请求 schema 做表单校验；Eden 从响应 schema 推导客户端类型。统一从包根导入 `@easy-vibe-coding/shared`。

### API 侧（`api/src`）

- **controller**：Elysia instance + `prefix` + `detail.tags`，每端点一行，schema 全来自 shared。
- **service**：object 字面量 + async 方法；业务错误抛 `Errors.notFound('Account not found')` 等（每个抛出点写具体、面向用户的消息）。
- **错误管线**（`libs/error` + `main.ts` 的 `onError`）：`ApiError` 原样归一化；Elysia `ValidationError` → 422 `VALIDATION` + fields；路由 miss → 404；其余 → 500 `INTERNAL`（堆栈记录，内部细节永不泄露）。**业务代码永不抛带自定义消息的 `INTERNAL`。**
- **数据库错误**：`isUniqueViolation`（`libs/dbError`）沿 cause 链找 PG 23505，唯一冲突转 `Errors.conflict`。
- **数据层**（`db/schema.ts`）：单一事实源、无 app import（drizzle-kit 独立加载）；时间戳在列声明层定为 RFC 3339 UTC 字符串（`timestamptz` customType），无 per-query 转换层。
- **ENV**（`env.ts`）：唯一允许碰 `Bun.env` 的文件（lint 强制），缺 `DATABASE_URL` 直接 throw。

### App 侧 hooks

> **one write vocabulary（约束）**：`useForm` 的 submit config 与 `useAPIMutation` 的 options **同形** `{ call, queryKey, successMessage, onSuccess?, onError? }` —— 表单写和非表单写读起来一样。`queryKey` 前缀 = 缓存命名空间，列表与写操作共用同一前缀。

### 数据层约定（约束速记）

- **无缓存默认**（`libs/queryClient`：`gcTime 0` / `staleTime 0` / `refetchOnMount 'always'` / `retry 0`）：每次挂载、过滤/翻页都是真实 fetch。**重试用户发起**（ErrorState 的 Retry），绝不自动。
- **动作词汇模式**：页面唯一 `onAction` 回调 + union 类型；新增行为 = 新 union 成员，永远不加新 prop。

### 错误处理（反馈通道约定）

读失败默认 toast（列表 opt out → ErrorState 内联）；写失败默认 toast 管线消息，**表单写 opt out** —— 服务器错误落到表单自身错误表面（字段错误 → `errors[name]`，其余 → `formError`）。表单是反馈通道，不 toast。

### 传参约定（object 优先）

- **两个以上字段的入口收成一个对象**：service 方法、hook options、组件 props、动作 payload 一律单对象入参 —— 调用点键值自解释、加字段不破坏调用点。service 方法统一单参数：`update({ id, data })`，不是 `update(id, data)`。
- **位置参数只留给三种例外**：单个值（`detail(id)`、`remove(id)`）；语义自明的二元运算（`addDays(date, days)`、`deepEqual(a, b)`）；宿主库固定签名（TanStack 的 `onSuccess(data, variables)` / `onError(error, variables)` —— 熟悉度优先，不包装）。

## 检查门禁与命令

- **`bun run check`**（`scripts/check.ts`）：先 `tsr generate`（新路由文件进路由树），再 vite-plus 检查（format + lint（type-aware）+ type-check，app + api + packages）。`check:fix` 带 `--fix`。
- **`bun dev`**：起 api（:3000）+ app（:5173）。api 的 dev script 先跳到仓库根再 `bun --watch`（Bun 只 watch 进程 cwd）——不跳的话 shared 包改动不触发重启。

```bash
bun install
docker compose up -d           # Postgres on 5432
cd api && cp .env.example .env # 需要时改 DATABASE_URL
cd api && bun run db:migrate    # 应用版本化迁移（首次=建表）
bun dev                        # api (:3000) + app (:5173)
cd api && bun run db:studio    # 检查 DB
```

**Schema 变更走版本化迁移**（唯一路径，没有 push）：改 `db/schema.ts` → `bun run db:generate`（生成 `drizzle/00XX_*.sql`，进 git 前先 review SQL）→ `bun run db:migrate`。追踪在 `drizzle` schema（drizzle-orm 默认），按 journal `when` 时间戳跳过已应用项；`db/migrate.ts` 是程序化 runner（生产部署同款），不是 `drizzle-kit migrate` CLI（CLI 在已有 `drizzle` schema 时会失败）。

## Skills（模式技能，`.agents/skills/`，按需加载）

| Skill            | 覆盖                                                                                                                                                        | 什么时候加载                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `feature`        | 全流程（渐进式披露，一个 skill）：`patterns`（共享约定/边界条件）→ `scaffold`（新资源）→ `list`（读侧列表）→ `form`（create/edit）→ `remove`（删除 + 编排） | 任何建/改 feature 的工作（列表、表单、对话框、CRUD 页）——先读 patterns，再按 SKILL.md 路由表读对应参考文件 |
| `feature-verify` | 分层验证：check 门禁 → DB → 启动 → curl 驱动（成功/失败路径）→ 坑位                                                                                         | 实现功能后、调试 API、确认修复时                                                                           |

## Workspaces

- **身份**：`slug` 是 workspace 的用户可见唯一标识（unique 必填，URL-safe：小写字母/数字/单连字符）；int 主键只在 DB 内部（FK 完整性、改名安全），任何 API 表面、token claim、前端都以 slug 寻址。**workspace 上下文 ref（`WorkspaceRef`，session 面）携带 `id`**（展示 + 缓存 key 用）；admin 的 workspace 面（member/permission）不靠 URL 参数——workspace 从 session 的 token slug claim 解析（`workspace` guard），ref 的 id 只用于展示/queryKey，不是寻址。slug 冲突 → 409。
- **归属**：`workspace_members`（workspace_id + account_id + role，unique 对）——创建即 owner 成员（事务），没有「无主 workspace」。role 词汇是 `owner | member`（`memberRoleSchema`，DB 列 `text` + `$type` 收窄）；创建时服务端写 `owner`，之后由 admin 管理。
- **用户表面**：`/workspaces`（成员身份列表 + 创建）、`/members`（当前 workspace 名册，`role: ['owner', 'member']` 守卫解析 slug→workspaceId；登录态 token → 403，成员已被移除 → 403）。workspace 内唯一路由 `/_app/members`。
- **admin 表面**（`modules/admin/workspaces`，前缀 `/workspaces/admin`）：平台级列表/统计/编辑/删除/开关（`admin: true`，URL 按 id/slug 寻址）+ 成员管理（`admin: true` + `workspace: true`：workspace 从 session 的 token slug claim 解析并注入 context——**URL 不传 workspace id**，admin 只能管理自己进入的 workspace：`GET /admin/members` · `POST /admin/members`（按邮箱加人，账号不存在 404、重复 409）· `PATCH /admin/members/:accountId`（改 role）· `DELETE /admin/members/:accountId`）。**不变式**：workspace 必须保持 ≥1 个 owner——降级/移除最后一个 owner → 409（`assertNotLastOwner`）。删除 workspace 级联清成员（FK cascade）。

## Admin（平台管理后台）

- **身份**：`accounts.isAdmin`（boolean，默认 false）是平台级 admin 标记。**引导：第一个注册的账号自动成为 admin**（auth service 的 count 预检，零配置；并发竞态只会多授权，不会少授权）。`accountResponseSchema` 带 `isAdmin` 上 wire——登录/注册/me 都回显，app 侧据此守卫 `/admin` 门。
- **守卫**：`api/src/libs/guards` 有 `auth`/`admin`/`workspace`/`role` 四个 macro——`admin: true` 在验 token 之外**每次请求重查 DB 行的 isAdmin**（行是事实源，撤销立即生效，不等 token TTL）。
- **边界**：admin 不能删除自己、不能撤销自己的 isAdmin（400）——保证平台永远至少有一个 admin。批量删除含自己 → 整批 400（显式拒绝，不是静默跳过）。
- **表面**：`accounts` 模块在 `modules/admin/accounts`，整块 admin-only（平台级账号 CRUD + `PATCH /:id/password` 重置密码——密码字段永不进通用 PATCH）；`workspaces` 的 admin 端点在 `modules/admin/workspaces`（见 Workspaces 节）。**模块归属规则：作用域决定位置——用户级模块在 `modules/<name>`，平台级 admin 模块在 `modules/admin/<name>`（镜像 app 侧 `pages/` + `pages/Admin/`）。** UI 是 `/admin` 壳（非 pathless，不依赖 workspace 上下文；`beforeLoad` token 守卫 + `useSession` + `isAdmin` 门），**复用普通用户布局**（`LayoutProvider` + 专属 `AdminSidebar` + `SiteHeader`/`usePageHeader`），侧边栏 nav = Overview（统计）/ Accounts / Workspaces。**admin 无应用内入口/切换器**：admin 面只靠 URL 直达（`/admin`，isAdmin 门守卫），`/` 对 admin 与普通用户无异（workspace 选择器不含 admin 卡片）。AdminSidebar 的上下文行是静态展示（无切换器），导航 = Overview（统计）/ Accounts / Workspaces。admin 是平台级、与 workspace 上下文正交。

**admin 进入 workspace**（平台级 workspace 面，结构对齐参考项目）：`/admin/workspaces` 列表**整行点击即进入**（Actions 也有 Enter 项）→ `POST /workspaces/admin/switch { slug }`（`modules/admin/workspaces`，`admin: true`，**无成员校验**——admin 可进入任意 workspace，区别于 `/auth/switch-workspace` 的成员门槛）→ 交换出带 `workspaceSlug` claim 的 token + workspace ref（含 id）→ 落在 `/admin/workspace/member`（成员管理页：加人/改角色/移除，复用 admin members 端点；以后 permission 等作为同级路由）。**`/auth/me` 对 admin 回显任意存在的 workspace**（成员校验只约束普通账号——admin 的 workspace 上下文不因非成员而丢，刷新靠 me 恢复）。**Fail-closed**：`routes/admin/workspace.tsx`（`WorkspaceShell`）是 `/admin/workspace/*` 的共享门——无 workspace 上下文 → 重定向 `/admin/workspaces`（组件级而非 beforeLoad：上下文靠 me 回显恢复，在壳的 session 门之后才落地）。**AdminSidebar 按路径切换两种模式**（参考项目）：GLOBAL（`/admin/*` 非 workspace 页）= Banner + 静态上下文行 + Overview/Accounts/Workspaces；WORKSPACE（`/admin/workspace/*`）= **Back to admin**（→ `/admin/workspaces`）退出 + workspace 卡片（可点开 `AdminWorkspaceSwitcher` 快速换 workspace，不离开当前页，重作用域）+ Member / Permission 占位导航。回普通应用只靠 URL `/`（无导航项）。

## Auth

- **机制**：JWT bearer（jose，HS256，7 天），密码 argon2id（`Bun.password`，零依赖）。token 存 `useGlobal`（persist），`libs/api` 的 `headers` 钩子逐请求注入，`onResponse` 全局拦截 401 → `clearSession`。**workspace 上下文（`useGlobal.workspace`，object `{ id, slug, name }`）不持久化**——boot 时从 `/auth/me` 的响应回显恢复（服务端真相源），交换 token 后写入内存；刷新靠 me 恢复，不靠 storage。
- **服务端守卫**（`api/src/libs/guards`）：纯 jose 原语（`libs/auth`）之上的 Elysia 适配层，四个 macro 同一实例 `.use(authGuard)`——`admin`/`workspace`/`role` 都声明 `auth: true` 组合复用验 token 逻辑，不复写。`auth: true`（或 `.guard({ auth: true })`）验 bearer token（不过 401），注入 `{ auth: { accountId, workspaceSlug? } }`。`admin: true` 是平台 admin 门：**每次请求重查 DB 行的 isAdmin**（行是事实源，撤销立即生效，不等 token TTL），非 admin → 403——**admin 不是 role，绝不混进角色列表**。`workspace: true` 是共享的 workspace 面 guard：要求 workspace 作用域会话，从 token 的 slug claim 解析并**注入 `workspace { id, slug, name, disabled }` 到 context**（workspace 必须仍存在，**URL 不传 workspace id**），handler 从 `({ workspace })` 读；它**不带授权**。`role: [...]` 是函数式 macro，option 值即允许的 **workspace 成员角色列表**（`'owner' | 'member'`，词汇来自 shared 的 `memberRoleSchema`），也声明 `workspace: true` 依赖作安全网（保证 workspace guard 先跑，显式声明时去重只执行一次），role 只判成员身份（按 `workspace.id` + accountId 查 membership 行），**不自己解析 slug**；**精确匹配：列表里有什么角色才放行什么——owner 不满足 `['member']`，"任意成员"写成 `['owner', 'member']`**；disabled 门在 role（被关闭的 workspace 对成员表现为已删除）。token 携带显式 `accountId` claim（`sub` 镜像同一 id），`/auth/switch-workspace` 交换后追加 `workspaceSlug` claim；DB 行是事实源，需要账号形状处（`/me`）才重查。**新模块加一行 `.use(authGuard)` 即接入；workspace 作用域的 feature 显式写 `.guard({ workspace: true, role: ['owner', 'member'] })`（任意成员）或 `['owner']` 等精确列表（选项自解释；role 的内部依赖作安全网），handler 收 `workspace.id`——不自己判 slug、不自己 join slug→id。admin 平台面用 `.guard({ admin: true })`（见 Admin 节）；admin 的 workspace 面（成员管理）用 `admin: true` + `workspace: true`。**
- **API**：`/api/auth/register`（建号即登录；**第一个注册的账号自动成为 admin**）· `/api/auth/login`（大小写不敏感匹配邮箱，错误统一 401 "Invalid email or password" 不泄露邮箱）· `/api/auth/me`（guard 解析 accountId → 服务重查当前账号行，并回显 workspace object `{ id, slug, name }`——成员校验只在普通账号生效，admin 回显任意存在 workspace；其余情况校验成员身份还在才回显，否则 null）。`/api/auth/switch-workspace`（POST `{ slug }`，非成员 403，签发带 `accountId + workspaceSlug` claim 的新 token）。`accounts` 模块整块在 `admin: true` 守卫后。契约在 `packages/shared/src/api/auth/`，密码字段规则复用 accounts 的 `accountFieldSchemas`。
- **路由**：应用壳是 pathless layout `/_app`（`beforeLoad` 同步 token 守卫 + 组件内 `useSession` 校验 me，loading/error/unauthenticated 三分支）；`/login` `/register` 在壳外，读 `redirect` search 参数（登录后回跳，`safeRedirect` 防开放重定向）。
- **边界**：登出纯客户端（JWT 无状态）。Elysia 先校验 body 再跑 guard（未带 token 但 body 非法 → 422 而非 401）。
