-- Organization-level company settings and material catalogs

create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
    organization_id uuid not null references public.organizations (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'admin',
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx
    on public.organization_members (user_id);

alter table public.profiles
    add column if not exists organization_id uuid references public.organizations (id);

create table if not exists public.company_settings (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null unique references public.organizations (id) on delete cascade,
    settings_json jsonb not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.material_catalogs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null unique references public.organizations (id) on delete cascade,
    catalog_json jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.company_settings enable row level security;
alter table public.material_catalogs enable row level security;

create policy "Organizations readable by members"
    on public.organizations for select
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = organizations.id
              and m.user_id = auth.uid()
        )
    );

create policy "Organization members readable by self"
    on public.organization_members for select
    using (user_id = auth.uid());

create policy "Company settings accessible by organization members"
    on public.company_settings for all
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = company_settings.organization_id
              and m.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = company_settings.organization_id
              and m.user_id = auth.uid()
        )
    );

create policy "Material catalogs accessible by organization members"
    on public.material_catalogs for all
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = material_catalogs.organization_id
              and m.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = material_catalogs.organization_id
              and m.user_id = auth.uid()
        )
    );

create or replace function public.ensure_user_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    org_id uuid;
begin
    if new.organization_id is not null then
        return new;
    end if;

    insert into public.organizations (name)
    values (split_part(new.email, '@', 1))
    returning id into org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (org_id, new.id, 'owner');

    new.organization_id := org_id;
    return new;
end;
$$;

drop trigger if exists profiles_ensure_organization on public.profiles;

create trigger profiles_ensure_organization
    before insert on public.profiles
    for each row execute function public.ensure_user_organization();
