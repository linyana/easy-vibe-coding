// Collision-safe slug derived from a workspace name: lowercase, runs of
// non-alphanumerics collapsed to '-'. Non-ASCII names (e.g. Chinese) yield ''
// — callers fall back to a placeholder. Uniqueness is enforced by the DB
// unique constraint; the service appends a -N suffix on collision.
export const slugify = (input: string): string =>
	input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
