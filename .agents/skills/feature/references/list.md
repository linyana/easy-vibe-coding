# List（读侧：服务端列表）

**何时读**：做/改列表（search / 过滤器 / 分页 / 多选入口）。写操作（表单 + 删除）在 form.md / remove.md。

**依赖的共享词汇**（都在 `@/components` / `@/hooks`，已审查过一遍，不要重写）：
`useAPIList`（列表机器）、`ListTable`（服务端表格）、`FormField` + `SearchInput`（过滤控件绑定）、`usePageHeader`（页面 title 声明，layout Header 渲染；action 留在正文）、`Actions`（行操作 kebab 菜单）、`ErrorState`（内嵌在 ListTable 里）。共享约定与边界条件见 `patterns.md`。

## 产出文件

```text
app/src/pages/Products/types/index.ts            # 实体类型 + action 词汇（本步骤创建——列表端点已存在）
packages/shared/src/api/products/list/index.ts   # 列表 query + 响应 schema
api/src/modules/products/controller.ts           # 一行接线（已有模块则加一行）
api/src/modules/products/service.ts              # list() 方法
app/src/pages/Products/List/index.tsx            # 行为模块：列表 + 过滤 + 批量操作
app/src/pages/Products/List/columns.tsx          # 列定义工厂
app/src/pages/Products/List/DateRangeFilter/     # feature 专属过滤器（需要时）
```

## 1. 契约层：list query + 响应 schema

`packages/shared/src/api/products/list/index.ts`。查询参数 schema 被 API 校验，Eden 客户端类型也从它推导；`.catch()`/`.default()` 让缺失或脏输入稳健。

```ts
import { z } from 'zod';
import { productResponseSchema } from '../shared';

// GET /products — 分页列表。查询参数由 api 校验（Eden 客户端类型亦由此推导）；
// `.default()`/`.catch()` 让缺失或脏输入在服务端稳健。
export const productListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
	search: z.string().max(100).optional().catch(undefined),
	// 需要日期过滤时（照抄 users 的 createdFrom/createdTo 写法）：
	// createdFrom: z.iso.datetime().optional().catch(undefined),
	// createdTo: z.iso.datetime().optional().catch(undefined),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// 列表响应：item 形状复用 shared 的响应 schema。形状固定 { items, total }（APIListResponse 契约）。
export const productListResponseSchema = z.object({
	items: z.array(productResponseSchema),
	total: z.number(),
});
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
```

规则：

- **搜索字段名统一 `search`**（沿用 users 的先例）。
- **日期过滤是 HALF-OPEN `[from, to)`**（语义见 patterns.md）：两个界都是 RFC 3339 UTC 瞬时；客户端负责把本地日转成瞬时（`createdFrom` = 所选本地日的凌晨，`createdTo` = 所选日**之后**那个凌晨——排他上界，服务端 `lt` 比较）。服务端永不猜时区。
- 在 `packages/shared/src/api/products/index.ts` 追加一行 `export * from './list';`。

## 2. API：controller 接线 + service list

controller（在已有模块里追加一行；新模块见 scaffold.md）：

```ts
.get('/', ({ query }) => productService.list(query), {
	query: productListQuerySchema,
	response: productListResponseSchema,
})
```

service 的 `list()`——**count + items 两个查询**，条件用 `and(...)` 拼（每个条件本身可 undefined）：

```ts
import { and, gte, ilike, lt, sql } from 'drizzle-orm'; // 本方法用到的操作符;其余见 users service 顶部全量 import

async list({ page, pageSize, search, createdFrom, createdTo }: ProductListQuery) {
	const keyword = search?.trim();
	// 搜索字段 = 你的资源的文本列（users 搜 name+email；Product 只搜 name）。
	// 结构照抄、字段是资源专属——别给没有 email 的资源搜 email。
	// HALF-OPEN [createdFrom, createdTo): 下界 gte、上界 lt（客户端发的是所选 "to" 日之后那个凌晨）。
	const where = and(
		keyword ? ilike(products.name, `%${keyword}%`) : undefined,
		createdFrom ? gte(products.createdAt, createdFrom) : undefined,
		createdTo ? lt(products.createdAt, createdTo) : undefined,
	);

	const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(where);
	const count = row?.count ?? 0;
	const items = await db.select().from(products).where(where).orderBy(products.id).limit(pageSize).offset((page - 1) * pageSize);
	return { items, total: count };
}
```

## 3. 页面 types（本步骤创建）

列表端点（根 GET）已建好，`API.products.get` 存在，`UseAPIItem` 现在能推导——scaffold 阶段只有 detail 端点（`/:id`），`UseAPIItem` 解的是 `{ items, total }` 列表形状，所以推导不出来，才延到这里。实体类型从 Eden 客户端推导，绝不手写镜像；动作词汇 = union（模式见 `patterns.md`）：

```ts
import type { API, UseAPIItem } from '@/libs/api';

export type Product = UseAPIItem<typeof API.products.get>;

export type ProductsAction =
	| { kind: 'create' }
	| { kind: 'edit'; product: Product }
	| { kind: 'delete'; product: Product }
	| { kind: 'deleteBatch'; products: Product[] };
```

## 4. List 行为模块

types 已在上面建好——List 消费它们，不重复定义。

`app/src/pages/Products/List/index.tsx`——**这是 feature 表面**：queryKey 命名空间、端点、列、布局。共享层（useAPIList + ListTable + FormField）owns 过滤状态（组件内存，无 URL）、queryKey 折叠、Eden 解包、分页转换、页码钳制、错误收窄、防抖搜索、实时计数。页面 title 在 layout Header（usePageHeader → SiteHeader），action 留在页面正文。

```tsx
import { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { API } from '@/libs/api';
import type { ProductsAction } from '../types';
import { useAPIList } from '@/hooks/useAPIList';
import { usePageHeader } from '@/hooks';
import { Button } from '@/components/ui/button';
import { FormField, ListTable, SearchInput } from '@/components';
import { DateRangeFilter } from './DateRangeFilter';
import { createColumns } from './columns';

export function ProductList({
	onAction,
}: {
	onAction: (action: ProductsAction) => void;
}) {
	const list = useAPIList({
		queryKey: ['products'], // 缓存命名空间——写操作用同一前缀失效
		call: API.products.get, // 原始 Eden treaty 方法；TSearch/TData 自动推导
		getRowId: (product) => String(product.id), // 批量操作需要：稳定行身份，勾选跨 refetch 存活
	});

	// 列工厂由页面 memo 化（依赖 onAction），列保持引用稳定。
	const columns = useMemo(() => createColumns({ onAction }), [onAction]);

	// 页头在 layout Header（usePageHeader → SiteHeader）：title 内联，description 作 info-icon tooltip。
	// action（create）留在页面正文——右对齐与过滤器同排。
	usePageHeader({ title: 'Products' });

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-4">
				<FormField control={list.control} name="search" label="Search">
					<SearchInput placeholder="Search…" />
				</FormField>
				{/* feature 专属过滤器：control 作为 prop 传入，内部用 FormField（见第 6 步） */}
				<DateRangeFilter control={list.control} />
				<Button
					onClick={() => onAction({ kind: 'create' })}
					className="ml-auto"
				>
					<PlusIcon className="size-4" />
					Create product
				</Button>
			</div>

			<ListTable
				list={list}
				columns={columns}
				emptyMessage="No products found"
				selection={{
					actions: (selected) => [
						{
							label: 'Delete',
							icon: { name: 'Trash2', style: 'destructive' },
							onClick: () =>
								onAction({
									kind: 'deleteBatch',
									products: selected,
								}),
						},
					],
				}}
			/>
		</div>
	);
}
```

要点：

- `control` 来自 useAPIList——过滤字段通过 `FormField` 绑定，`name` 对共享 query schema **类型检查**（拼错 = 编译错误）。
- **所有动作通过唯一 `onAction` 流出**：列操作、批量工具栏都派发到这里。
- `getRowId` 只在需要批量操作时配；不配则不渲染复选框。

## 5. columns 工厂

`app/src/pages/Products/List/columns.tsx`——每 feature 的表格表面：渲染哪些字段、什么顺序、什么格式化、什么动作。动作列是普通一列（`meta: { align, fixed }` 控制对齐和固定），菜单 chrome 用共享 `Actions`。

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { Actions, features } from '@/components';
import { formatDateTime } from '@/libs/dates';
import type { Product, ProductsAction } from '../types';

export function createColumns({
	onAction,
}: {
	onAction: (action: ProductsAction) => void;
}): ColumnDef<typeof features, Product>[] {
	return [
		{
			accessorKey: 'id',
			header: 'ID',
			cell: ({ row }) => (
				<span className="text-muted-foreground tabular-nums">
					{row.original.id}
				</span>
			),
		},
		{
			accessorKey: 'name',
			header: 'Name',
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			accessorKey: 'price',
			header: 'Price',
			cell: ({ row }) => (
				<span className="tabular-nums">{row.original.price}</span>
			),
		},
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatDateTime(row.original.createdAt)}
				</span>
			),
		},
		{
			id: 'actions',
			meta: { align: 'center', fixed: 'right' },
			header: 'Actions',
			cell: ({ row }) => (
				<Actions
					items={[
						{
							label: 'Edit',
							icon: { name: 'Pencil' },
							onClick: () =>
								onAction({
									kind: 'edit',
									product: row.original,
								}),
						},
						{
							label: 'Delete',
							icon: { name: 'Trash2', style: 'destructive' },
							onClick: () =>
								onAction({
									kind: 'delete',
									product: row.original,
								}),
						},
					]}
				/>
			),
		},
	];
}
```

要点：

- 图标名用 lucide 自己的导出名（`'Pencil'`、`'Trash2'`），`style: 'destructive'` 让动作/菜单项变破坏性红色（危险项自动与安全项分隔）。
- 时间列用 `formatDateTime`（`libs/dates`），不手写格式化。

## 6. feature 专属过滤器（超出共享词汇时）

模式：接收 `control` prop，内部用 `FormField` 绑定——字段必须存在于共享 query schema（类型检查兜底）。

```tsx
import {
	FormField,
	DateFromInput,
	DateToInput,
	type FormControl,
} from '@/components';
import type { ProductListQuery } from '@easy-vibe-coding/shared';

export function DateRangeFilter({
	control,
}: {
	control: FormControl<ProductListQuery>;
}) {
	return (
		<div className="flex items-center gap-2">
			<FormField control={control} name="createdFrom">
				<DateFromInput aria-label="Created from" />
			</FormField>
			<span className="text-muted-foreground">–</span>
			<FormField control={control} name="createdTo">
				<DateToInput aria-label="Created to" />
			</FormField>
		</div>
	);
}
```

## 7. 批量删除（入口在这里，实现在 remove.md）

列表侧只负责**多选入口**：`getRowId` + `ListTable` 的 `selection` prop（配置见第 4 步的 List 代码，不重复贴）。关键语义：工具栏触发时把选中行**冻结成 action 快照**派发给页面——`onClick: () => onAction({ kind: 'deleteBatch', products: selected })`，对话框的 mutation 目标不会在打开期间漂移。

页面按 `action.kind === 'deleteBatch'` 渲染 `DeleteProductsDialog`（batch 对话框 + `batch-delete` 契约/端点的完整实现，见 **remove.md**）。批量语义提醒：**删掉能删的**——不存在的 id 静默跳过（`deleted` 计数少，不是错误），单条删除才是 notFound。

## 边界条件（list 专属；共享部分在 patterns.md）

- **`keepPreviousData`**：翻页/搜索变化时旧行留在屏幕上，不闪空白表。**首载与在途请求走同一个 loading mask**（`Loading` 包住表格 + 页脚 + 分页，见 `ListTable`）；页脚始终渲染真实计数 "Showing x - y of n"（在请求 settle 后读取），没有 "Loading…" 字样。
- **页码钳制**：删掉最后一页最后一行（或结果集缩小）不会留在不存在的页——useAPIList 的 clamp effect 兜底。
- **选择语义**：勾选是本地 UI 状态（按 `getRowId` 键控，跨 refetch 存活）；每次翻页/过滤变化时重置（批量操作永远瞄准当前屏幕上的行）；`selectedItems` 从**实时数据**推导——服务端删除的行自然掉出，工具栏计数归零自动卸载，不需要显式清理。
- **`dropEmpty`**：空过滤值（undefined/''）从 state 里剥掉——清空搜索会真正移除过滤条件。
- **列表错误内联渲染**：ListTable 用共享 ErrorState 渲染收窄后的错误，绝不静默空表；同时保留默认的 toast 提示（`toastError` 默认开）——toast 是瞬时信号，ErrorState 是持久恢复面，两者并存是刻意设计。单内容块的页面（如 Home 的 stats 卡片）才关 toast 只留 ErrorState。
- **动作列 `meta: { fixed: 'right' }`**：列固定 + antd 风格阴影只在表格可横向滚动时出现。

## 自检清单

- [ ] query schema 在 shared 契约里，`.catch()`/`.default()` 处理了脏输入？日期字段是 `z.iso.datetime()` + 注释写明了 HALF-OPEN 语义？
- [ ] 列表响应形状是 `{ items, total }`？API 侧没持有自己的 schema？
- [ ] `useAPIList` 传了显式 `queryKey` 前缀 + 原始 treaty 方法（没写 `callEden`，没写注解）？
- [ ] 过滤控件通过 `FormField control={list.control}` 绑定，`name` 拼写正确（编译错误兜底）？
- [ ] 所有动作走唯一 `onAction`？页面编排按 `kind` 分支渲染？
- [ ] 批量操作配了 `getRowId` + `selection.actions`？批量对话框/契约/端点见 remove.md（自检也在那里）？
- [ ] 没有把过滤状态放进 URL、没有给路由加 `validateSearch`、没有发明 per-feature hook？
- [ ] `bun run check` 通过？
