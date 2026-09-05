ALTER TABLE "llm_providers" ALTER COLUMN "kind" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "llm_providers" ADD COLUMN "preset" text DEFAULT null;--> statement-breakpoint
ALTER TABLE "llm_providers" ADD COLUMN "api" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_providers" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_providers" ADD COLUMN "base_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- Backfill legacy kind rows (0006 drops kind): map each stored kind to its
-- registry-equivalent preset row so existing rows keep their meaning.
UPDATE "llm_providers" SET
	"api" = CASE "kind"
		WHEN 'anthropic' THEN 'anthropic-messages'
		WHEN 'openai' THEN 'openai-responses'
		ELSE 'openai-completions'
	END,
	"name" = CASE "kind"
		WHEN 'anthropic' THEN 'Anthropic'
		WHEN 'openai' THEN 'OpenAI'
		ELSE 'Custom'
	END,
	"base_url" = CASE "kind"
		WHEN 'anthropic' THEN 'https://api.anthropic.com'
		WHEN 'openai' THEN 'https://api.openai.com/v1'
		ELSE ''
	END,
	"preset" = CASE WHEN "kind" IN ('anthropic', 'openai') THEN "kind" ELSE NULL END
	WHERE "kind" <> '';
