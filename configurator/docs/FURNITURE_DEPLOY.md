# Furniture app — deploy checklist

Client #2 (`apps/furniture`) is a **separate product** from stands. It needs its **own** Supabase project and **own** Vercel project. Same GitHub repo, different hosting and database.

## 1. Supabase (new project)

1. [supabase.com](https://supabase.com) → **New project** (e.g. `furniture-configurator`).
2. Note **Project URL** and **anon/publishable key** (Settings → API).
3. On your PC, from the **repo root**:

```bash
npm install
npm run supabase -- login
npm run db:link -- --project-ref <furniture-project-ref>
npm run db:push
```

`db:link` only links one project at a time in this folder. To switch back to stands later, run `db:link` again with the stands project ref.

4. **Authentication → Providers**: enable Email.
5. **Authentication → URL configuration** (after Vercel URL exists):
   - **Site URL**: `https://<your-furniture-app>.vercel.app`
   - **Redirect URLs**: that URL + `http://localhost:5173` (for local dev)

6. **First owner** (invite-only): invite the first admin email in SQL or create a pending invite before they use `/join`. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 2. Local dev

```bash
cp apps/furniture/.env.example apps/furniture/.env
# Edit with the FURNITURE Supabase URL + key (not stands keys)
npm run dev:furniture
```

Open the URL Vite prints (usually `http://localhost:5173`).

## 3. Vercel (new project)

Create a **second** Vercel project from the **same** GitHub repository.

### Recommended settings (pick one approach)

**Option A — Root Directory = `apps/furniture`** (uses `apps/furniture/vercel.json` in the repo)

| Setting | Value |
|---------|--------|
| Framework | Other |
| Root Directory | `apps/furniture` |
| Install / Build / Output | Leave empty — `apps/furniture/vercel.json` sets these |

**Option B — Root Directory = repo root**

| Setting | Value |
|---------|--------|
| Framework | Other |
| Root Directory | `.` (empty / repo root) |
| Install Command | `npm install` |
| Build Command | `npm run build:furniture` |
| Output Directory | `apps/furniture/dist` |

Do **not** mix Option A and B (e.g. Root = `apps/furniture` **and** Output = `apps/furniture/dist` — that double path causes **404**).

### If you see `404: NOT_FOUND`

1. Vercel → your **furniture** project → **Deployments** — open the latest deploy. If it failed, fix the build error first.
2. **Settings → General → Root Directory**: use `apps/furniture` (Option A) **or** repo root (Option B), not both styles at once.
3. **Settings → Build & Development**: confirm Output Directory is `dist` (Option A) or `apps/furniture/dist` (Option B).
4. **Redeploy** after changing settings (Deployments → ⋯ → Redeploy).

**Environment variables** (Production + Preview):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | Furniture Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Furniture anon/publishable key |

Deploy. Default URL will be like `furniture-configurator.vercel.app`.

Rename the project in **Settings → General** or add a **custom domain** (e.g. for your uncle's store).

Update Supabase **Site URL** and **Redirect URLs** to match the live Vercel URL.

## 4. What's different in the furniture app (today)

Configured in `apps/furniture/client.config.ts`:

- Branding: "Furniture Configurator"
- **Off**: artwork on faces, DPI, customer portal link, reviews panel, AR, manufacturing/ERP (flags set; some toolbar items may still appear until you trim UI further)
- **On**: quotes, templates (same codebase as stands for now)

3D models and catalog are still stand modules until you replace them for furniture.

## 5. GitHub

Commit `apps/furniture/` with the rest of the monorepo. Do **not** commit `apps/furniture/.env`.

## 6. Two clients summary

| | Stands | Furniture |
|---|--------|-----------|
| App folder | `apps/stands` | `apps/furniture` |
| Vercel build | `npm run build:stands` | `npm run build:furniture` |
| Output | `apps/stands/dist` | `apps/furniture/dist` |
| Supabase | Project A | Project B |
| Env file | `apps/stands/.env` | `apps/furniture/.env` |
