import { z } from 'zod';
import { workspaceRefSchema } from '../shared';

// A workspace addressed by its slug (the URL is the address now). The member
// view's shell fetches this once per slug page: the server resolves the slug
// from the request and re-validates membership per request — nothing is
// session-scoped anymore.
export const workspaceDetailResponseSchema = workspaceRefSchema;
export type WorkspaceDetailResponse = z.infer<
	typeof workspaceDetailResponseSchema
>;
