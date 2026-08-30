# Scaffold（新资源脚手架）

**何时读**：资源文件夹还不存在时——products/orders… 第一次出现。这是 feature 的第一步：把资源"造出来并编译通过"。list / form / remove / 验证在后续步骤。

> 命名表和红线在 `SKILL.md`（本 skill 的总纲）——四个形式一起替换，其余照抄。

## 产出文件

```text
packages/shared/src/api/products/shared/index.ts   # 响应 schema 基座 + id params + success 响应（可复用形状只定义一次）
packages/shared/src/api/products/get/index.ts      # detail 端点契约（shared 类型别名，保持"每接口一文件夹"）
packages/shared/src/api/products/index.ts           # 本资源的 re-export 集合（先只有 shared + get，随 feature 追加）
packages/shared/src/api/index.ts                    # 追加一行 export（按资源分文件夹）
api/src/db/schema.ts                                # products 表（追加 pgTable）
api/src/modules/products/controller.ts              # Elysia instance + prefix + tag + 第一个端点（detail）
api/src/modules/products/service.ts                 # service 字面量 + detail()
api/src/main.ts                                     # import + .use(productsController) + openapi tag
app/src/pages/Products/index.tsx                    # 页面骨架（占位；list 步骤接手后替换成完整编排）
app/src/pages/index.ts                              # 追加 export
app/src/routes/products.tsx                         # createFileRoute + 页面 re-export
```

## 1. 契约基座（shared）

`packages/shared/src/api/products/shared/index.ts`——被多个端点复用的形状，**定义一次，绝不镜像**。响应 schema 就是线上 (wire) 形状：Eden 客户端类型由它推导，API 用它校验，app 的类型从它流出来。

```ts
import { z } from 'zod';

// 响应 schema = wire 形状。字段与 schema.ts 的表列逐个对齐；
// 时间戳是 RFC 3339 UTC 字符串（z.iso.datetime()），不是 Date。
export const productResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	price: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type ProductResponse = z.infer<typeof productResponseSchema>;

// 被 get / edit / delete 复用的路径参数
export const productIdParamsSchema = z.object({
	id: z.coerce.number().int(),
});
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;

// 被 delete 等"无返回体"操作复用的成功响应
export const successResponseSchema = z.object({
	success: z.boolean(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;
```

`packages/shared/src/api/products/index.ts`——re-export 集合，随 feature 追加行：

```ts
// 每个 REST 接口一个文件夹,文件夹内 index.ts 定义该接口的 schema。
// 新增接口:加一个文件夹,在此追加一行 export。
export * from './shared';
export * from './get';
// 后续步骤在此追加：export * from './list'; ./create; ./edit; ./delete; ./batch-delete
```

`packages/shared/src/api/products/get/index.ts`——**每接口一文件夹**的结构保持；detail 没有独有 schema，只是 shared 类型别名（照抄 accounts 的 get）：

```ts
import type { ProductIdParams, ProductResponse } from '../shared';

// GET /products/:id — 完全复用共享契约(productIdParamsSchema + productResponseSchema),
// 没有独有 schema。此文件夹保持"每接口一文件夹"的结构一致;类型别名让调用方
// 能从接口文件夹直接拿到完整契约类型。
export type GetProductParams = ProductIdParams;
export type GetProductResponse = ProductResponse;
```

`packages/shared/src/api/index.ts` 追加一行 `export * from './products';`。

## 2. 数据层（db/schema.ts）

在 `api/src/db/schema.ts` 追加一张表——**复制 accounts 表的结构**（id identity + 两个时间戳列 + 类型导出），字段换成你的资源字段。文件顶部的 `timestamptz` customType 是**唯一**的时间戳列类型（wire 形状 = RFC 3339 UTC 字符串），不引入任何新的日期转换层：

```ts
export const products = pgTable('products', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	price: integer('price').notNull(), // 示例用 integer 存数字字段;真实资源按需换 numeric/text
	createdAt: timestamptz('created_at')
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamptz('updated_at')
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => new Date().toISOString()),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

要点：

- 唯一约束（如 email）在列上 `.unique()`，service 侧配合 `isUniqueViolation` 转 `Errors.conflict`（细节见 form.md）。**大小写不敏感的唯一字段**（email、slug、username）用 `citext` customType（见 `api/src/db/schema.ts`）——唯一约束和 `eq` 比较自动大小写不敏感，DB 层兜底，代码里没有需要记得的归一化；`libs/email` 的 `normalizeEmail` 只负责存量数据整齐（正确性不依赖它）。注意 drizzle-kit 生成的 `SET DATA TYPE` SQL 会带 `"undefined"."citext"` bug，手改成 `CREATE EXTENSION IF NOT EXISTS citext;` + `USING email::citext`（见 `api/drizzle/0001_*.sql`）。
- 改完 `cd api && bun run db:generate && bun run db:migrate`——schema.ts 是数据层唯一事实源，不迁移则运行时查不到新表（版本化迁移是唯一路径，没有 push）。

## 3. API 模块

`api/src/modules/products/controller.ts`——Elysia instance + prefix + tag，schema 全从 shared 导入，API 侧不持有自己的 schema。**第一个端点做 detail**：它是最简单的最小端点，让模块有第一个编译通过的端点。注意：页面类型的 `UseAPIItem<typeof API.products.get>` 依赖的是**根 GET（list 端点）**——`UseAPIItem` 解的是 `{ items, total }` 列表形状（见 `app/src/libs/api` 的 `AnyEdenListFn`），detail 端点（`/:id`）不提供它。所以页面 types 在 list 步骤创建（见 list.md）。

```ts
import { Elysia } from 'elysia';
import {
	productIdParamsSchema,
	productResponseSchema,
} from '@easy-vibe-coding/shared';
import { productService } from './service';

export const productsController = new Elysia({
	prefix: '/products',
	detail: {
		tags: ['Products'],
	},
}).get('/:id', ({ params }) => productService.detail(params.id), {
	params: productIdParamsSchema,
	response: productResponseSchema,
});
// 后续端点在此追加：list → list.md；create/edit → form.md；delete/batch-delete → remove.md
```

`api/src/modules/products/service.ts`——object 字面量 + async 方法；业务错误抛 `Errors.*`（`libs/error`），永不返回错误、永不手动 `set.status`：

```ts
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { products, type Product } from '../../db/schema';
import { Errors } from '../../libs/error';

export const productService = {
	async detail(id: number): Promise<Product> {
		const product = await db.query.products.findFirst({
			where: eq(products.id, id),
		});
		if (!product) throw Errors.notFound('Product not found');
		return product;
	},
};
```

`api/src/main.ts`——import + 挂载 + openapi tag（三处改动）：

```ts
import { productsController } from './modules/products/controller';
// ...
// openapi documentation.tags 数组里追加：
{ name: 'Products', description: 'Product management.' },
// ...
.use(accountsController)
.use(productsController);
```

## 4. App 骨架

> 页面 types（`Product` / `ProductsAction`）**不在本步骤创建**——`UseAPIItem<typeof API.products.get>` 依赖根 GET（list 端点），scaffold 只有 detail 端点，推导不出来。list 步骤建好列表端点后，第一件事就是建 types（见 list.md §3）。

`app/src/pages/Products/index.tsx`——占位骨架（list 步骤接手后替换成完整编排）：

```tsx
import { usePageHeader } from '@/hooks';

export const Products = () => {
	// 页头在 layout Header（usePageHeader → SiteHeader）：title 内联，description 作 info-icon tooltip
	usePageHeader({ title: 'Products' });
	return null;
};
```

`app/src/pages/index.ts` 追加一行 `export * from './Products';`。

`app/src/routes/products.tsx`——薄接线（红线 2），**不加 validateSearch**（列表过滤在组件内存）：

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { Products } from '@/pages';

export const Route = createFileRoute('/products')({
	component: Products,
});
```

## 自检清单

- [ ] shared 基座只有一份响应形状？`api/index.ts` 和资源 `index.ts` 都追加了 export？
- [ ] schema.ts 加了表且 `bun run db:generate && bun run db:migrate` 同步？时间戳用 `timestamptz`？
- [ ] controller 有 prefix + tag + detail 端点？`main.ts` 挂了且 openapi tags 加了？
- [ ] 页面骨架 + 路由接线存在，`app/src/pages/index.ts` 追加了 export？
- [ ] `bun run check` 通过（tsr generate 已把新路由放进路由树）？

## 下一步

- 列表（search / 分页 / 批量入口）→ **list.md**
- 写操作（表单 + 删除）→ **form.md** / **remove.md**
