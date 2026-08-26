# Remove（写侧：删除 + 页面编排）

**何时读**：做/改删除（单条 / 批量）或页面编排（index.tsx）。创建/编辑表单在 form.md。共享约定（type-to-confirm、批量 vs 单条语义、无变量写、错误通道）见 `patterns.md`。

## 产出文件

```text
packages/shared/src/api/products/delete/index.ts   # 单条删除（通常只是类型别名）
packages/shared/src/api/products/batch-delete/     # 批量删除（需要时）
api/src/modules/products/controller.ts             # delete/batch-delete 端点
api/src/modules/products/service.ts                # remove/removeMany
app/src/pages/Products/Delete/index.tsx            # 单条删除对话框
app/src/pages/Products/Delete/batch-dialog.tsx     # 批量删除对话框
app/src/pages/Products/index.tsx                   # 编排（所有对话框的组装点）
```

## 1. 单条删除

`app/src/pages/Products/Delete/index.tsx`——canonical 非表单写。审查面 = 写配置 + 文案 + `confirmText`；type-to-confirm 门、pending、破坏性红色全在共享 RemoveDialog 里。

```tsx
export function DeleteProductDialog({
	product,
	open,
	onOpenChange,
}: {
	product: Product;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const mutation = useAPIMutation({
		call: () => API.products({ id: product.id }).delete(), // 无变量——闭包捕获目标
		queryKey: ['products'],
		successMessage: 'Product deleted',
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Delete product"
			confirmText={product.name}
			mutation={mutation}
		>
			{`You are about to permanently delete ${product.name}. This action cannot be undone.`}
		</RemoveDialog>
	);
}
```

要点：

- **`confirmText` = 被删记录的名字**——确认必须读目标，误点不能级联成删除。`confirmText` 必须非空（空串会直接武装动作）。
- RemoveDialog 的 `mutation` 只读 `isPending` + `mutate()`——**无变量写**（`call: () => ...`）。有变量的写需要就地扩展共享层（AGENTS.md 红线 4）。
- **对话框只在成功时关闭**（onSuccess → onOpenChange(false)）——取消走 Cancel，open 状态始终是页面唯一事实源。

## 2. 批量删除（列表多选的删除变体）

入口在列表（`list.md` 的 selection 配置）；对话框是 RemoveDialog 的**数量确认**变体——批量没有可打的名字，打数量迫使读计数。**对话框收到选中行的快照**（List 在工具栏触发时把 selection 冻结进 action），mutation 目标不会在对话框打开期间漂移。

```tsx
export function DeleteProductsDialog({
	products,
	open,
	onOpenChange,
}: {
	products: Product[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const count = products.length;
	const mutation = useAPIMutation({
		call: () =>
			API.products['batch-delete'].post({
				ids: products.map((product) => product.id),
			}),
		queryKey: ['products'],
		successMessage:
			count === 1 ? 'Product deleted' : `${count} products deleted`,
		onSuccess: () => onOpenChange(false),
	});

	return (
		<RemoveDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`Delete ${count} ${count === 1 ? 'product' : 'products'}`}
			confirmText={String(count)}
			mutation={mutation}
		>
			{`You are about to permanently delete ${count} ${count === 1 ? 'product' : 'products'}. This action cannot be undone.`}
		</RemoveDialog>
	);
}
```

配套契约 + 端点：

```ts
// packages/shared/src/api/products/batch-delete/index.ts
// 批量语义：删掉能删的——不存在的 id 静默跳过,不是错误(单条删除才是 notFound)。
export const productBatchDeleteSchema = z.object({
	ids: z.array(z.number().int()).min(1).max(100),
});
export const productBatchDeleteResponseSchema = z.object({
	deleted: z.number().int(),
});
```

```ts
// service
async removeMany(ids: number[]): Promise<{ deleted: number }> {
	const deleted = await db.delete(products).where(inArray(products.id, ids)).returning({ id: products.id });
	return { deleted: deleted.length };
}
```

controller 接线（单条 + 批量）：

```ts
.delete('/:id', ({ params }) => productService.remove(params.id), { params: productIdParamsSchema, response: successResponseSchema })
.post('/batch-delete', ({ body }) => productService.removeMany(body.ids), { body: productBatchDeleteSchema, response: productBatchDeleteResponseSchema })
```

> **import 维护**：同上——补 shared import（`successResponseSchema` / `productBatchDeleteSchema` / `productBatchDeleteResponseSchema`）+ 资源 `index.ts` 的 re-export（`./delete`、`./batch-delete`）。

service 里单条 `remove` 是**精确操作**：删 0 行 = `Errors.notFound`（与批量"静默跳过"形成对比，语义见 patterns.md）。

## 3. 页面编排（index.tsx）——最后一个写步骤

```tsx
export const Products = () => {
	const [action, setAction] = useState<ProductsAction | null>(null);
	const [open, setOpen] = useState(false);
	// ...
	return (
		<>
			<ProductList onAction={handleAction} />
			{action?.kind === 'create' && (
				<CreateProductDialog
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'edit' && (
				// key 按行重挂载:表单从新行重新播种(useForm 的 initialValues 是快照,无 sync effect)
				<EditProductDialog
					key={action.product.id}
					product={action.product}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'delete' && (
				<DeleteProductDialog
					key={action.product.id}
					product={action.product}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
			{action?.kind === 'deleteBatch' && (
				<DeleteProductsDialog
					products={action.products}
					open={open}
					onOpenChange={handleOpenChange}
				/>
			)}
		</>
	);
};
```

**`key={...}` 重挂载是 Edit/Delete 的必选项**——`initialValues`/确认文本从快照播种，切行必须重新播种。编排只管"哪个对话框开着、为谁开"，按 `action.kind` 分支；新增行为 = 新 union 成员 + 一个分支（patterns.md 的动作词汇模式）。

## 边界条件（写侧）

- **双向校验，服务器兜底**：zod schema 做 UX 前置校验；conflict/竞态/规则外情况由服务器错误映射回表单（useForm 的 onError 按 `schema.shape` 判断字段归属——匹配字段 → `errors[name]`，否则 → `formError`）。
- **写绝不自动重试**（mutations `retry: 0`）——双提交风险。
- **`onError` 覆盖默认失败 toast 的场景**：表单写不用（表单是反馈通道）；非表单写（删除）默认 toast 管线消息即可。

## 自检清单

- [ ] batch-delete 有 `min(1).max(100)`？service 单条删 0 行抛 `Errors.notFound`？批量静默跳过？
- [ ] RemoveDialog 的 `confirmText` 非空（单条 = 名字，批量 = 数量）？mutation 是无变量写？
- [ ] 对话框只在成功时关闭（onSuccess → onOpenChange(false)）？
- [ ] 页面用 `key={...}` 重挂载 Edit/Delete 对话框？编排按 `action.kind` 分支？
- [ ] 服务器失败落在表单/对话框（不重复 toast）？测试数据已清理？
- [ ] `bun run check` 通过？
