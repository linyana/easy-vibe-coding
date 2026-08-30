# Form（写侧：创建 / 编辑表单）

**何时读**：做/改创建或编辑表单。删除（单条 / 批量）和页面编排在 remove.md。共享约定（one write vocabulary、错误通道、key 重挂载、requireDirty）见 `patterns.md`。

**写词汇簇**（项目哲学：**one write vocabulary**——`useAPIMutation` 的 config 和 `useForm` 的 submit **同形** `{ call, queryKey, successMessage, onSuccess }`；表单写和非表单写读起来一样）：

```text
useAPIMutation   基础写 hook：callEden → 失效 queryKey 前缀 → toast 成功 → onSuccess
useForm          表单写：state + 校验 + submit 一体，submit 内部委托 useAPIMutation
Form             form 元素 + Enter 提交 + 整体错误槽——页面表单和对话框共用
FormSubmitButton useForm 按钮接线只写一次的地方（loading/disabled/tooltip）——内联和对话框 footer 都拼它
FormField        字段绑定（label/tooltip/description + 错误注入）——列表过滤和表单共用
```

## 产出文件

```text
packages/shared/src/api/products/create/index.ts   # 字段规则基座 + create 请求 schema
packages/shared/src/api/products/edit/index.ts     # partial 更新 schema（从基座派生）
api/src/modules/products/controller.ts             # post/patch 端点接线
api/src/modules/products/service.ts                # create/update
app/src/pages/Products/Create/index.tsx            # 创建对话框
app/src/pages/Products/Edit/index.tsx              # 编辑对话框
```

## 1. 契约层：字段规则基座（关键模式）

`packages/shared/src/api/products/create/index.ts`——**字段规则定义一次**：`fieldSchemas` 是"实体字段规则"的基座，create 用它组装、edit 从它派生 partial，规则绝不镜像：

```ts
import { z } from 'zod';

// POST /products — 创建请求体。字段规则定义一次:productFieldSchemas 是
// "实体字段规则"的基座,create 用它组装、edit 用它 partial,所以规则绝不镜像。
// 响应复用 shared 的 productResponseSchema（scaffold 建好）。
export const productFieldSchemas = {
	name: z.string().trim().min(1, 'Name is required').max(100),
	price: z.coerce.number().min(0, 'Price must be ≥ 0'),
};

export const productCreateSchema = z.object(productFieldSchemas);
export type ProductCreate = z.infer<typeof productCreateSchema>;
```

`packages/shared/src/api/products/edit/index.ts`——从基座 partial，**不加空 patch 校验会留下"空更新也算成功"的洞**：

```ts
import { z } from 'zod';
import { productFieldSchemas } from '../create';

// PATCH /products/:id — 部分更新:create 字段规则的任意子集(从共享基座派生,不镜像)。
// 不能直接从 productCreateSchema .partial() 派生:zod 4 的 .partial() 拒绝带 refine 的
// object schema(create 一旦加跨字段规则,派生会炸)。两边都从 productFieldSchemas 组装。
export const productUpdateSchema = z
	.object(productFieldSchemas)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field is required',
	});
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
```

规则：

- **为什么 edit 不从 create `.partial()` 派生**：zod 4 的 `.partial()` 拒绝带 object 级 refine 的 schema——共享字段基座让两边各自组装，create 可以有 refine、edit 可以 partial。
- **表单级规则**（需要时）：不带 `path` 的 `.refine()` 落在 useForm 的 `formError` 槽（Form 在字段下方渲染）；跨字段规则应加 `path: ['field']` 锚到具体字段。
- 在 `packages/shared/src/api/products/index.ts` 追加 `export * from './create';` 等。

## 2. API：controller 接线 + service

controller 端点（新模块见 scaffold.md，已有模块照此追加）：

```ts
.post('/', ({ body }) => productService.create(body), { body: productCreateSchema, response: productResponseSchema })
.patch('/:id', ({ params, body }) => productService.update({ id: params.id, data: body }), { params: productIdParamsSchema, body: productUpdateSchema, response: productResponseSchema })
```

> **import 维护**：端点多了，controller 顶部从 `@easy-vibe-coding/shared` 的 import 要同步补（accounts controller 的 import 列表就是全量清单）——新增端点 = 补 import + 一行接线 + 资源 `index.ts` 一行 re-export。

service 要点：

- `create`：**唯一约束冲突要转 `Errors.conflict`**（`isUniqueViolation` 沿 cause 链找 PG 23505），绝不透传驱动错误：

```ts
async create(data: ProductCreate): Promise<typeof products.$inferSelect> {
	try {
		const [product] = await db.insert(products).values(data).returning();
		return product!;
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw Errors.conflict('This product already exists');
		}
		throw error;
	}
}
```

- `update`：`if (!row) throw Errors.notFound('...')`——删 0 行 / 找不到 = notFound（精确操作）。

## 3. Create 对话框

`app/src/pages/Products/Create/index.tsx`——feature 表面只有：schema + initialValues + submit config + 字段 + footer 按钮。共享层（useForm + Form/FormSubmitButton/FormField）owns 校验、错误显示、提交编排、pending 状态；create/edit 对话框没有专属组件——就是 `Dialog` + `Form` 的显式组合。

```tsx
import { productCreateSchema } from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';

export function CreateProductDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: productCreateSchema,
		initialValues: { name: '', price: 0 },
		submit: {
			call: (values) => API.products.post(values),
			queryKey: ['products'],
			successMessage: 'Product created',
			onSuccess: () => onOpenChange(false),
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create product"
			description="Add a new product."
			// Tooltip buttons precede the inputs in DOM order — Radix's default
			// first-focusable would light one up.
			preventAutoFocus
			footer={
				<>
					<Button
						variant="outline"
						disabled={form.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<FormSubmitButton form={form}>
						Create
					</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				<FormField form={form} name="name" label="Name">
					<Input placeholder="Name" />
				</FormField>
				<FormField
					form={form}
					name="price"
					label="Price"
					tooltip="Must be ≥ 0."
				>
					<Input type="number" placeholder="0" />
				</FormField>
			</Form>
		</Dialog>
	);
}
```

## 4. Edit 对话框

与 Create **同一模式**，三个差异：表单从被编辑行播种、submit 走 PATCH、`requireDirty: true`（没改不提交——空保存是假成功）：

```tsx
export function EditProductDialog({
	product,
	open,
	onOpenChange,
}: {
	product: Product;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm({
		schema: productCreateSchema, // 表单用 create 的基座（全字段校验）
		initialValues: { name: product.name, price: product.price },
		submit: {
			call: (values) => API.products({ id: product.id }).patch(values), // PATCH = 合法部分更新
			queryKey: ['products'],
			successMessage: 'Product updated',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});
	// ... 字段与 Create 相同
}
```

**关键**：

- 表单 schema 用 **create 基座**（不是 update schema）——表单显示全部字段、全量校验；"完整表单保存"就是合法的部分更新。
- **页面用 `key={product.id}` 重挂载对话框**（见 remove.md 编排）——`initialValues` 总是当前行的值（useForm 的 initialValues 是快照，无 sync effect）。

## 5. useForm 契约要点（FormApi）

`Form` 通过 `form={form}` 整体消费；feature 只需要知道这些决策点：

- **校验是活的**：每次编辑重跑共享 schema，但字段错误**只在被编辑过后显示**（touched 门）——编辑一个字段绝不点亮整个表单。必填 `*` 来自 schema（`isRequired`），submit 按钮 tooltip 显示第一个问题。
- **submit 编排**（hook 内部）：重校验 → callEden → 失效 queryKey → toast 成功 → reset → `onSuccess`（通常关对话框）。
- **服务器失败落在表单里，不 toast**：字段路径匹配表单字段的错误 → `errors[name]`（标记 touched 以显示）；其余（网络断、无字段冲突）→ `formError`（`Form` 的整表错误槽）。**服务器是权威**——conflict、竞态、schema 表达不了的规则都在这层兜底。
- **submit 按钮只在整表有效时可用**（也顺带禁了 Enter 隐式提交）；`submitDisabledReason` 解释禁用原因（第一个校验问题，或 `requireDirty` 下 "No changes to save"），由 `FormSubmitButton` 渲染成 tooltip——它把按钮接线写一次，页面表单内联、对话框 footer 都拼同一个组件。
- **整表单契约检查在 submit 调用点免费发生**：`call: (values) => API.products.post(values)` 结构性对比表单类型与 API schema——缺字段/多字段/类型不符都是编译错误。

## 自检清单

- [ ] 字段规则只在 `fieldSchemas` 基座定义一次，create 组装、edit partial 派生（没镜像）？
- [ ] update schema 有"至少一个字段"refine？
- [ ] service 的唯一约束冲突转 `Errors.conflict`？
- [ ] `useForm` 用了共享 schema（不是自写校验）？`call` 处整表单契约检查通过（编译通过 = 契约匹配）？
- [ ] Edit 有 `requireDirty: true`？页面用 `key={...}` 重挂载 Edit 对话框（编排见 remove.md）？
- [ ] 服务器失败落在表单（字段 → `errors[name]`，其余 → `formError`，不重复 toast）？
- [ ] `bun run check` 通过？
