-- email identity is case-insensitive: comparisons (and the unique constraint)
-- on this column are case-insensitive from now on. Extension is required by
-- the column type; drizzle-kit emitted a malformed "undefined"."citext" here,
-- so this file is hand-corrected (see schema.ts citext customType).
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE citext USING "email"::citext;
