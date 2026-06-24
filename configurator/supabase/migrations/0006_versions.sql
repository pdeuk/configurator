-- Project revision history (Supabase Postgres)

create table if not exists public.project_revisions (
    id uuid primary key default gen_random_uuid(),
    project_id text not null,
    version_number integer not null,
    snapshot_json jsonb not null,
    message text not null default '',
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (project_id, version_number)
);

create index if not exists project_revisions_project_id_idx
    on public.project_revisions (project_id, version_number desc);

create index if not exists project_revisions_created_at_idx
    on public.project_revisions (created_at desc);

alter table public.project_revisions enable row level security;

create policy "Project revisions readable by project owner"
    on public.project_revisions for select
    using (
        exists (
            select 1
            from public.projects p
            where p.id = project_revisions.project_id
              and p.user_id = auth.uid()
        )
    );

create policy "Project revisions manageable by project owner"
    on public.project_revisions for insert
    with check (
        exists (
            select 1
            from public.projects p
            where p.id = project_revisions.project_id
              and p.user_id = auth.uid()
        )
    );

create policy "Project revisions updatable by project owner"
    on public.project_revisions for update
    using (
        exists (
            select 1
            from public.projects p
            where p.id = project_revisions.project_id
              and p.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.projects p
            where p.id = project_revisions.project_id
              and p.user_id = auth.uid()
        )
    );

create policy "Project revisions deletable by project owner"
    on public.project_revisions for delete
    using (
        exists (
            select 1
            from public.projects p
            where p.id = project_revisions.project_id
              and p.user_id = auth.uid()
        )
    );

-- Reserved for audit trail / manufacturing history exports
comment on table public.project_revisions is
    'Immutable project snapshots for revision history, approvals, and manufacturing audit.';
