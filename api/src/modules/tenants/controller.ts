import { Elysia } from 'elysia';
import {
	tenantCreateSchema,
	tenantIdParamsSchema,
	tenantListQuerySchema,
	tenantListResponseSchema,
	tenantMemberCreateSchema,
	tenantMemberParamsSchema,
	tenantMemberResponseSchema,
	tenantMembersListQuerySchema,
	tenantMembersListResponseSchema,
	tenantResponseSchema,
	tenantUpdateSchema,
	tenantWithRoleSchema,
} from '@easy-vibe-coding/shared';
import { memberService, tenantService } from './service';
import { authGuard, tenantScope } from '../../libs/guards';
export const tenantsController = new Elysia({
	prefix: '/tenants',
	detail: {
		tags: ['Tenants'],
	},
})
	// tenantScope is the whole gate for the scoped routes below: auth (inline,
	// same libs/auth primitives) + membership. Root routes above keep the
	// authGuard macro.
	.use(authGuard)
	.guard({ auth: true }, (app) =>
		app
			.post(
				'/',
				({ body, auth }) =>
					tenantService.create({
						name: body.name,
						userId: auth.userId,
					}),
				{
					body: tenantCreateSchema,
					response: tenantResponseSchema,
				},
			)
			.get(
				'/',
				({ query, auth }) =>
					tenantService.list({ userId: auth.userId, query }),
				{
					query: tenantListQuerySchema,
					response: tenantListResponseSchema,
				},
			),
	)
	.derive(tenantScope)
	.get('/:tenantId', ({ tenant }) => tenantService.detail(tenant), {
		response: tenantWithRoleSchema,
	})
	.patch(
		'/:tenantId',
		({ tenant, auth, body }) =>
			tenantService.rename({
				tenantId: tenant.tenantId,
				role: tenant.role,
				isAdmin: auth.isAdmin,
				// The update schema guarantees at least one field and name is
				// its only field — present on every valid patch.
				name: body.name!,
			}),
		{
			params: tenantIdParamsSchema,
			body: tenantUpdateSchema,
			response: tenantResponseSchema,
		},
	)
	.get(
		'/:tenantId/members',
		({ tenant, query }) =>
			memberService.list({
				tenantId: tenant.tenantId,
				query,
			}),
		{
			params: tenantIdParamsSchema,
			query: tenantMembersListQuerySchema,
			response: tenantMembersListResponseSchema,
		},
	)
	.post(
		'/:tenantId/members',
		({ tenant, body }) =>
			memberService.add({
				tenantId: tenant.tenantId,
				role: tenant.role,
				email: body.email,
			}),
		{
			params: tenantIdParamsSchema,
			body: tenantMemberCreateSchema,
			response: tenantMemberResponseSchema,
		},
	)
	.delete(
		'/:tenantId/members/:userId',
		({ tenant, params, auth }) =>
			memberService.remove({
				tenantId: tenant.tenantId,
				role: tenant.role,
				userId: params.userId,
				actingUserId: auth.userId,
			}),
		{
			params: tenantMemberParamsSchema,
			response: tenantMemberResponseSchema,
		},
	);
