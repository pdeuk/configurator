-- Configurator cloud schema (Supabase Postgres + Storage)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.projects (
    id text primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    name text not null,
    document_json jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);

create table if not exists public.project_shares (
    id uuid primary key default gen_random_uuid(),
    project_id text not null references public.projects (id) on delete cascade,
    token text not null unique,
    permissions jsonb not null default '{"view": true, "duplicate": false}'::jsonb,
    expires_at timestamptz not null,
    disabled boolean not null default false,
    project_snapshot jsonb,
    created_at timestamptz not null default now()
);

create index if not exists project_shares_token_idx on public.project_shares (token);

create table if not exists public.artwork_assets (
    id uuid primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    filename text not null,
    mime_type text not null,
    storage_path text not null,
    metadata_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists artwork_assets_user_id_idx on public.artwork_assets (user_id);

insert into storage.buckets (id, name, public)
values ('project-artwork', 'project-artwork', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_shares enable row level security;
alter table public.artwork_assets enable row level security;

create policy "Profiles are readable by owner"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Profiles are insertable by owner"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Projects are manageable by owner"
    on public.projects for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Artwork assets are manageable by owner"
    on public.artwork_assets for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Project shares manageable by project owner"
    on public.project_shares for all
    using (
        exists (
            select 1
            from public.projects p
            where p.id = project_shares.project_id
              and p.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.projects p
            where p.id = project_shares.project_id
              and p.user_id = auth.uid()
        )
    );

create policy "Artwork objects readable by owner"
    on storage.objects for select
    using (
        bucket_id = 'project-artwork'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Artwork objects writable by owner"
    on storage.objects for all
    using (
        bucket_id = 'project-artwork'
        and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'project-artwork'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
