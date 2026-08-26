# Patterns（共享词汇与边界条件）

所有阶段共用的约定与"为什么"。**开始任何 feature 前先读一遍**；scaffold / list / form / remove 不重复这些内容，需要时回来看。

## 实体类型从 Eden 推导，永不手写镜像

```ts
export type Product = UseAPIItem<typeof API.products.get>;
```

app 永不复制 wire 形状——类型从 Eden 客户端流出来（Eden 从 shared 响应 schema 推导）。手写镜像 = 两端漂移。

> **前提**：`UseAPIItem` 解的是 `{ items, total }` 列表形状，所以 `API.products.get` 必须是**根 GET（list 端点）**——detail 端点（`/:id`）不提供它。scaffold 阶段还没有根 GET，types 文件在 list 步骤（列表端点建好后）创建。

## 动作词汇模式（页面唯一 onAction）

```ts
export type ProductsAction =
	| { kind: 'create' }
	| { kind: 'edit'; product: Product }
	| { kind: 'delete'; product: Product }
	| { kind: 'deleteBatch'; products: Product[] };
```

- 页面唯一 `onAction` 回调 + union 类型；**新增行为 = 新 union 成员，永不新增 prop**。
- kind + payload 同走——"编辑对话框带着错误的行"在构造上不可能。
- 行为模块只认识自己的动作；页面编排按 `kind` 分支渲染。

## one write vocabulary（约束）

`useAPIMutation` 的 config 与 `useForm` 的 submit **同形** `{ call, queryKey, successMessage, onSuccess?, onError? }`——表单写和非表单写读起来一样。`queryKey` 前缀 = 缓存命名空间，列表与写操作共用同一前缀（写后失效命中列表）。

## 错误通道约定（反馈通道）

- 读失败默认 toast；**列表读 opt out** → ListTable 内联 ErrorState（绝不静默空表）。
- 写失败默认 toast 管线消息；**表单写 opt out** → 服务器错误落到表单自身表面：字段路径匹配的 → `errors[name]`（标记 touched 以显示），其余（网络断、无字段冲突）→ `formError`。表单是反馈通道，不 toast。
- 错误**永不丢弃、永不重复**（不 toast 也不静默）。
- API 侧业务代码永不返回错误、永不手动 `set.status`——抛 `Errors.*`，由 `main.ts` 的 `onError` 统一归一化成 `{ code, message, fields }`。

## 无缓存默认 + 重试用户发起

`gcTime 0` / `staleTime 0` / `refetchOnMount 'always'` / `retry 0`：每次挂载、过滤/翻页都是真实 fetch。**重试用户发起**（ErrorState 的 Retry → refetch，仅 `isRetryableError` 网络级或 5xx 显示）；写（mutations）绝不自动重试——双提交风险。

## HALF-OPEN 日期语义 `[from, to)`

两个界都是 RFC 3339 UTC 瞬时。客户端把本地日转成瞬时：`createdFrom` = 所选本地日的凌晨，`createdTo` = 所选日**之后**那个凌晨（排他上界，服务端 `lt` 比较）。**服务端永不猜时区**；一切 instant ↔ 本地日历日转换收敛在 `app/src/libs/dates`。

## key 重挂载（Edit/Delete 必选）

```tsx
<EditProductDialog key={action.product.id} product={action.product} ... />
```

`useForm` 的 `initialValues` 是快照（无 sync effect），确认文本也从快照播种——切行必须用 `key={...}` 重挂载重新播种。

## requireDirty 与空 patch 的洞（两侧都有）

- **UI 侧**：Edit 用 `requireDirty: true`——没改不提交（空保存是假成功）；create 表单总是"脏"的，不需要。
- **契约侧**：update schema 的 `.refine((data) => Object.keys(data).length > 0)` 防"空更新算成功"。

## type-to-confirm（RemoveDialog）

`confirmText` 必须非空（空串会直接武装动作）——单条 = 被删记录的名字，批量 = 数量。确认必须读目标，误点不能级联成删除。

## 批量 vs 单条删除语义

- 单条 = **精确操作**：删 0 行 = `Errors.notFound`。
- 批量 = **"删我给的这些里存在的"**：不存在的 id 静默跳过（`deleted` 计数少，不是错误）。

## 无变量写（闭包捕获目标）

```ts
call: () => API.products({ id: product.id }).delete(),  // 无变量——闭包捕获目标
```

RemoveDialog 的 `mutation` 只读 `isPending` + `mutate()`。有变量的写需要就地扩展共享层（见 AGENTS.md 红线 4）。

## 列表过滤状态在组件内存

`useState` 经 `useAPIList`，**不进 URL**；URL 保持干净，不给列表路由加 `validateSearch`。
