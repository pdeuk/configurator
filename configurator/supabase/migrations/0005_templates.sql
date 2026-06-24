-- Organization-level stand layout templates

create table if not exists public.templates (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    name text not null,
    description text not null default '',
    category text not null,
    thumbnail_url text,
    project_snapshot jsonb not null,
    created_at timestamptz not null default now(),
    created_by uuid references public.profiles (id) on delete set null
);

create index if not exists templates_organization_id_idx
    on public.templates (organization_id);

create index if not exists templates_category_idx
    on public.templates (organization_id, category);

alter table public.templates enable row level security;

create policy "Templates accessible by organization members"
    on public.templates for all
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = templates.organization_id
              and m.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = templates.organization_id
              and m.user_id = auth.uid()
        )
    );
