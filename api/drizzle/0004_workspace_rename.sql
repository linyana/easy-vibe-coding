-- Rename tenants → workspaces, add the stable public slug identifier.
-- Hand-written (drizzle-kit prompts on table renames in non-TTY) — mirrors
-- api/src/db/schema.ts exactly. Development data is 2 rows; slug backfill is
-- the name slugified (test/test2), which is collision-free here.

ALTER TABLE "tenants" RENAME TO "workspaces";
ALTER TABLE "tenant_members" RENAME TO "workspace_members";
ALTER TABLE "workspace_members" RENAME COLUMN "tenant_id" TO "workspace_id";

-- Constraint names follow the table they belong to — rename to match the new
-- names drizzle generates from the schema (keeps future diffs clean).
ALTER TABLE "workspace_members" RENAME CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" TO "workspace_members_workspace_id_workspaces_id_fk";
ALTER TABLE "workspace_members" RENAME CONSTRAINT "tenant_members_user_id_users_id_fk" TO "workspace_members_user_id_users_id_fk";
ALTER TABLE "workspace_members" RENAME CONSTRAINT "tenant_members_tenant_id_user_id_pk" TO "workspace_members_workspace_id_user_id_pk";

-- slug: nullable first so existing rows can be backfilled, then NOT NULL +
-- unique. Identity sequences (tenants_id_seq) were renamed to workspaces_id_seq
-- automatically by the table rename.
ALTER TABLE "workspaces" ADD COLUMN "slug" text;
UPDATE "workspaces" SET "slug" = trim(regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));
ALTER TABLE "workspaces" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_slug_unique" UNIQUE ("slug");
