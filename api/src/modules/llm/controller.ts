import { Elysia } from 'elysia';
import {
	llmListResponseSchema,
	llmProviderCreateSchema,
	llmProviderIdParamsSchema,
	llmProviderModelsResponseSchema,
	llmProviderResponseSchema,
	llmProviderUpdateSchema,
	llmSelectionGetResponseSchema,
	llmSelectionUpsertSchema,
	successResponseSchema,
} from '@easy-vibe-coding/shared';
import { llmService } from './service';
import { guards } from '../../libs/guards';

// Account-scoped (personal settings, not workspace-scoped): the `auth` macro
// resolves the accountId claim; every endpoint operates on that account's own
// rows only. Static routes (selection) sit before the :id routes.
export const llmController = new Elysia({
	prefix: '/llm',
	detail: {
		tags: ['LLM'],
	},
})
	.use(guards)
	.guard({ auth: true }, (app) =>
		app
			.get('/', ({ auth }) => llmService.list(auth.accountId), {
				response: llmListResponseSchema,
			})
			.post(
				'/',
				({ auth, body }) =>
					llmService.create({
						accountId: auth.accountId,
						data: body,
					}),
				{
					body: llmProviderCreateSchema,
					response: llmProviderResponseSchema,
				},
			)
			.get(
				'/selection',
				({ auth }) => llmService.getSelection(auth.accountId),
				{ response: llmSelectionGetResponseSchema },
			)
			.put(
				'/selection',
				({ auth, body }) =>
					llmService.setSelection({
						accountId: auth.accountId,
						data: body,
					}),
				{
					body: llmSelectionUpsertSchema,
					response: llmSelectionGetResponseSchema,
				},
			)
			.delete(
				'/selection',
				({ auth }) => llmService.clearSelection(auth.accountId),
				{ response: successResponseSchema },
			)
			.post(
				'/:id/models',
				({ params, auth }) =>
					llmService.models({
						accountId: auth.accountId,
						id: params.id,
					}),
				{
					params: llmProviderIdParamsSchema,
					response: llmProviderModelsResponseSchema,
				},
			)
			.patch(
				'/:id',
				({ params, body, auth }) =>
					llmService.update({
						accountId: auth.accountId,
						id: params.id,
						data: body,
					}),
				{
					params: llmProviderIdParamsSchema,
					body: llmProviderUpdateSchema,
					response: llmProviderResponseSchema,
				},
			)
			.delete(
				'/:id',
				({ params, auth }) =>
					llmService.remove({
						accountId: auth.accountId,
						id: params.id,
					}),
				{
					params: llmProviderIdParamsSchema,
					response: successResponseSchema,
				},
			),
	);
