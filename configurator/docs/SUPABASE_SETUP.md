# Supabase setup

This app uses Supabase for authentication, organizations, roles, and cloud project storage.

## 1. Local environment (not committed)

Copy `apps/stands/.env.example` to `apps/stands/.env` and set:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Get these from **Supabase Dashboard → Project Settings → API**.

`.env` is gitignored. Never commit keys to GitHub.

## 2. Install dependencies

The Supabase CLI is included as a dev dependency (no global install needed):

```bash
npm install
```

Use `npm run supabase -- <command>` or the shortcuts below.

## 3. Link the CLI (one time per machine)

```bash
npm run supabase -- login
npm run db:link -- --project-ref <your-project-ref>
```

Example for this project:

```bash
npm run db:link -- --project-ref lwswymfezieqrvfqtuqw
```

## 4. Apply database migrations

From the project root (monorepo):

```bash
npm run db:push
```

Check migration status:

```bash
npm run db:status
```

Migrations run in order from `supabase/migrations/`:

1. `0001_schema.sql` — profiles, projects, artwork
2. `0002_settings.sql` — organizations, members, company settings
3. `0003_roles.sql` — role permissions and RLS
4. `0004_customers.sql` — customer portal tables
5. `0005_templates.sql` — project templates
6. `0006_versions.sql` — project revisions
7. `0007_reviews.sql` — review workflow
8. `0008_analytics.sql` — analytics events
9. `0009_organization_invites.sql` — email invites and join-on-signup
10. `0010_fix_profile_org_trigger.sql` — fixes signup failing with HTTP 500
11. `0011_invite_only_signup.sql` — blocks registration without a pending invite

If `db push` fails on a fresh project, run the same files manually in the Supabase SQL editor in that order.

## 5. Auth settings

In **Authentication → Providers**:

- Enable **Email**
- Set **Site URL** to your dev URL (e.g. `http://localhost:5173`)
- Add redirect URLs if needed
- For development, you can disable **Confirm email** under Email provider settings so signup works without inbox confirmation

## 6. First user

1. Start the app: `npm run dev`
2. **Register** on the landing page — you become **owner** of a new organization
3. Open **More → Users & roles** to invite teammates by email and role

## 7. Invites (invite-only access)

The organization workspace is **invite-only**. The home page is sign-in only.

1. Owner/admin invites a teammate in **More → Users & roles**
2. Teammate opens **`/join`** (e.g. `https://your-app.vercel.app/join`)
3. They register with the **same email** that was invited
4. They sign in on the home page after that

Owners and admins can invite `admin`, `sales`, `designer`, or `production` by email.

- **New users**: on signup at `/join` they join your organization with the invited role
- **Existing users**: on next login the app calls `claim_pending_organization_invite()` to join

Invites cannot assign the `owner` role.

## 8. Roles

| Role | Access |
|------|--------|
| owner / admin | Full access + user management |
| sales | Projects + quotes |
| designer | Projects only |
| production | View projects + manufacturing exports |

Frontend: `packages/core/src/auth/RoleModel.ts`  
Database RLS: `supabase/migrations/0003_roles.sql`

## 9. GitHub

Commit these (safe for the repo):

- `packages/core/` — shared skeleton
- `apps/stands/` — client #1 app
- `supabase/migrations/` and `supabase/config.toml`
- `apps/stands/.env.example` (placeholders only)
- Root `package.json`, `package-lock.json`, `vercel.json`

Do **not** commit:

- `apps/stands/.env` (real keys)
- Database password
- `supabase/.temp/` (gitignored — created by `db:link`)

After cloning on a new machine: `npm install`, copy `apps/stands/.env.example` → `apps/stands/.env`, then `npm run db:link` and `npm run db:push` if the database is not up to date.

## 10. Vercel deployment

The app is a Vite SPA. `vercel.json` already rewrites routes to `index.html`.

**Vercel project settings**

| Setting | Value |
|---------|--------|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

**Environment variables** (Vercel → Project → Settings → Environment Variables). Required for **Production** and **Preview**:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable or anon key from Supabase API settings |

Vite bakes these in at **build time**, so redeploy after changing them.

**Supabase Auth (production)**

In **Authentication → URL configuration**:

- **Site URL**: your Vercel production URL (e.g. `https://your-app.vercel.app`)
- **Redirect URLs**: add the same URL and `http://localhost:5173` for local dev

**Database**

Vercel only hosts the frontend. Run migrations against Supabase separately (`npm run db:push` from your machine or CI), not during the Vercel build.
