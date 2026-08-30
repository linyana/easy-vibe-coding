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
10. **不新建 `core/`**，不重命名 `app/src/pages`。`modules/`（API）和 `pages/`（UI）是两侧各自的概念名。
11. **组件间 import 用精确子路径**（`@/components/data`、`@/components/ui/button`），顶层 barrel `@/components` 只给消费者用。`ui/` 无 barrel，直接按文件路径导入。

## 新增一个 feature 的标准工作流

> 参照范例：`accounts`（唯一 canonical 模块）。**深度细节、可复制代码、边界条件都在 skills 里**（见文末 Skills 表）——动手前先加载对应 skill，本文档只给骨架。**任何 feature 工作只加载一个 `feature` skill**（渐进式披露）：先读它的 patterns 参考文件，再按 SKILL.md 里的路由表读当前步骤对应的文件（新资源 → scaffold）。

```text
1. 契约层  packages/shared/src/api/<resource>/<endpoint>/   每端点一文件夹一 index.ts（请求+响应 zod schema）
2. API 层  api/src/modules/<name>/  controller 只接线（schema 全从 shared 导入）· service 写逻辑（抛 Errors）· main.ts 挂载
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
  modules/<name>/   controller.ts（路由 + 校验接线）· service.ts（逻辑）
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

## Auth

- **机制**：JWT bearer（jose，HS256，7 天），密码 argon2id（`Bun.password`，零依赖）。token 存 `useGlobal`（persist），`libs/api` 的 `headers` 钩子逐请求注入，`onResponse` 全局拦截 401 → `clearSession`。
- **服务端守卫**（`api/src/libs/guards`）：纯 jose 原语（`libs/auth`）之上的 Elysia 适配层——`macro('auth')` 把 `.guard({ auth: true })`（或路由级 `{ auth: true }`）变成“先验 bearer token，不过 401”，并把已验证身份注入 handler 为 `{ auth: { accountId } }`。token 携带显式 `accountId` claim（`sub` 镜像同一 id）；DB 行是事实源，需要账号形状处（`/me`）才重查。**新模块加一行 `.use(authGuard).guard({ auth: true })` 即受保护。**
- **API**：`/api/auth/register`（建号即登录）· `/api/auth/login`（大小写不敏感匹配邮箱，错误统一 401 "Invalid email or password" 不泄露邮箱）· `/api/auth/me`（guard 解析 accountId → 服务重查当前账号行）。`accounts` 模块整块在 guard 后。契约在 `packages/shared/src/api/auth/`，密码字段规则复用 accounts 的 `accountFieldSchemas`。
- **路由**：应用壳是 pathless layout `/_app`（`beforeLoad` 同步 token 守卫 + 组件内 `useSession` 校验 me，loading/error/unauthenticated 三分支）；`/login` `/register` 在壳外，读 `redirect` search 参数（登录后回跳，`safeRedirect` 防开放重定向）。
- **边界**：登出纯客户端（JWT 无状态）。Elysia 先校验 body 再跑 guard（未带 token 但 body 非法 → 422 而非 401）。
