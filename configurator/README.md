# Configurator platform

Monorepo for the shared **configurator core** and **per-client apps**.

## Structure

```text
configurator-platform/
├── packages/core/          @configurator/core — shared skeleton (auth, cloud, roles, client profiles)
├── apps/stands/            @configurator/stands — CLIENT #1 (exhibition stands)
├── supabase/migrations/    shared database schema (all clients)
├── docs/
└── vercel.json             deploy config (builds apps/stands)
```

## Quick start (client #1 — stands)

```bash
npm install
cp apps/stands/.env.example apps/stands/.env   # Windows: copy ...
# Edit apps/stands/.env with Supabase URL + anon key
npm run dev
```

Commands run from the **repo root** and target the stands app by default.

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (stands) |
| `npm run build` | Production build |
| `npm run db:push` | Apply Supabase migrations |
| `npm run db:link -- --project-ref <ref>` | Link Supabase CLI |

## Environment variables

Create `apps/stands/.env` (not committed):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-key>
```

On **Vercel**, set the same variables for the project. Root `vercel.json` builds `apps/stands` and outputs `apps/stands/dist`.

If you previously used `.env` at the repo root, move it to `apps/stands/.env`.

## Adding a new client (e.g. furniture)

1. Copy `apps/stands` → `apps/furniture` (or scaffold a thinner app).
2. Add `"@configurator/furniture": "apps/furniture"` to workspaces (automatic via `apps/*`).
3. Create `client.config.ts` with features/models for that vertical.
4. New **Supabase** + **Vercel** project per client.
5. Keep shared logic in `packages/core`; customize UI, 3D models, and features in the client app.

See `packages/core/src/client/ClientProfile.ts` for feature flags (artwork, DPI, quotes, etc.).

## Supabase

Shared migrations live in `supabase/migrations/`. Full setup: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## GitHub / Vercel

- Commit the whole monorepo (no `.env` files).
- Vercel: use the root `vercel.json` **or** set **Root Directory** to `apps/stands` and use `apps/stands/vercel.json`.
- Install command: `npm install` at repo root (npm workspaces).

---

## Client apps

| App | Package | Description |
|-----|---------|-------------|
| Stands | `@configurator/stands` | Exhibition stands configurator (client #1) |
