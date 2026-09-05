# easy-vibe-coding

**Build your idea, not the boilerplate.**

A full-stack starter engineered for AI-assisted development ("vibe coding") — with the manual built into the repo. Describe a feature in plain language — _"I want a list of products with search, pagination, and an edit page"_ — and the AI implements it end-to-end using the system's pre-built components and copyable patterns. You review only the feature code the AI wrote.

> The boilerplate — auth, data layer, error handling, theming, component library — is already built and wired together. You stay in business-logic land. Boundary conditions (pagination edge cases, validation, error pipelines) are thought through once, in the system, not per feature.

## How it works

1. **You describe the feature.** In plain language. No architecture decisions required.
2. **The AI implements it end-to-end.** It copies the repo's canonical example (accounts CRUD: list + search + pagination + create/edit/delete) and adapts it. It does not invent new structure.
3. **You review only the feature code.** The infrastructure is used, never rewritten. Every line you review is a line the AI wrote for _your_ feature.

## Why it works

- **The AI is the generator.** No CLI scaffolders, no JSON configs. The repo itself is the manual: a vocabulary of components plus canonical example features (list, form/edit, detail, settings, dashboard, auth).
- **The review surface is the feature code.** Every line the AI writes is review cost. Components exist to keep that surface small.
- **Types are the safety net.** End-to-end type safety (Elysia + Eden Treaty + Drizzle on the API, TanStack Router/Query on the app) turns mistakes into compiler errors — which keeps the copy-and-adapt workflow reliable.
- **Simple features, well-defined edges.** Features stay minimal, but their boundary conditions are explicit. A small surface with explicit edge-case handling beats a large surface with hidden states.
- **Latest, future-standard tooling.** TypeScript 7 (native compiler), Bun, React 19, Vite 8, Tailwind 4. Current standard, never the least common denominator.

## What's inside

**Shared contract (`packages/shared`, done)** — the cross-boundary contract

- Error codes (`{ code, message, fields }` wire shape) + zod request schemas (body/query/params)
- The API validates with these zod schemas directly (Elysia supports Standard Schema); the app reuses them for form validation (and router search params where a route reads them) — field rules are defined once, never mirrored

**API template (done)** — Elysia + Drizzle + Postgres + Eden Treaty

- Unified error pipeline: `Errors` → single `onError` → `{ code, message, fields }`
- Wire-truth response schemas (zod, validated by Elysia, types derived by Eden); timestamps are RFC 3339 UTC strings declared once at the DB column level — no per-query conversion layer
- Centralized ENV (lint-enforced)
- `accounts` CRUD (list w/ search + pagination, get, create, patch, delete, batch-delete) — the canonical feature module, verified against a live Postgres

**App template (done)** — React 19 + Vite 8 + shadcn/ui + Tailwind 4 + TanStack Router/Query + zustand

- Shared hooks: `useAPIQuery` (reads) / `useAPIList` (paginated lists) / `useAPIMutation` (writes) / `useForm` (edit-create forms)
- List filters live in component state (URL stays clean); Eden Treaty client with wire-truth responses (`parseDate: false`)
- Accounts page (table + search + pagination + create/edit/delete/batch-delete dialogs) — the canonical feature page

## Quick start

```bash
bun install
docker compose up -d          # Postgres on 5432
cd api && cp .env.example .env  # edit DATABASE_URL if needed
cd api && bun run db:migrate  # apply versioned migrations (only schema path — no push)
bun dev                       # api (:3000) + app (:5173)
cd api && bun run db:studio   # inspect the DB
```

## AI tool integration (skills)

Pattern skills live in [`.agents/skills/`](./.agents/skills/) — loaded on demand by the AI (`feature` builds anything: scaffold/list/form/remove as progressive-disclosure reference files; `feature-verify` checks changes end-to-end). Tools that read skills from their own directories need them symlinked over; a sync script for that is on the roadmap — until then, point your tool at `.agents/skills/` directly.

## Next steps

- Example features (detail/dashboard/settings archetypes)
- Skill sync script (`bun run setup`) for tools that read skills from their own directories
- Auth is done: JWT bearer (jose) + argon2id (Bun.password), `/login` `/register` pages, session-gated shells, 401 auto-logout. Workspaces are addressed by URL slug (`/workspaces/:slug/…`) — no token exchange on workspace switch. See AGENTS.md → Workspaces / Auth.

## The manual

[`AGENTS.md`](./AGENTS.md) is the manual the AI reads — the full working principles and current state. The repo doesn't document the system; it _is_ the system.

[`.agents/skills/`](./.agents/skills/) holds the pattern skills the AI loads on demand: `feature` (the whole build pipeline — scaffold/list/form/remove reference files under progressive disclosure) and `feature-verify` (verifying changes end-to-end).
