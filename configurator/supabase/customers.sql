-- Organization customers and project access for the customer portal

create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    name text not null,
    email text not null,
    company text not null default '',
    auth_user_id uuid unique references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists customers_organization_id_idx
    on public.customers (organization_id);

create unique index if not exists customers_organization_email_idx
    on public.customers (organization_id, lower(email));

create table if not exists public.customer_project_access (
    customer_id uuid not null references public.customers (id) on delete cascade,
    project_id text not null,
    permissions jsonb not null default '{"view": true, "comment": true, "approve": true}'::jsonb,
    primary key (customer_id, project_id)
);

create index if not exists customer_project_access_project_id_idx
    on public.customer_project_access (project_id);

alter table public.customers enable row level security;
alter table public.customer_project_access enable row level security;

create policy "Customers manageable by organization members"
    on public.customers for all
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = customers.organization_id
              and m.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = customers.organization_id
              and m.user_id = auth.uid()
        )
    );

create policy "Customers readable by linked auth user"
    on public.customers for select
    using (auth_user_id = auth.uid());

create policy "Customer project access manageable by organization members"
    on public.customer_project_access for all
    using (
        exists (
            select 1
            from public.customers c
            join public.organization_members m on m.organization_id = c.organization_id
            where c.id = customer_project_access.customer_id
              and m.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.customers c
            join public.organization_members m on m.organization_id = c.organization_id
            where c.id = customer_project_access.customer_id
              and m.user_id = auth.uid()
        )
    );

create policy "Customer project access readable by linked customer"
    on public.customer_project_access for select
    using (
        exists (
            select 1
            from public.customers c
            where c.id = customer_project_access.customer_id
              and c.auth_user_id = auth.uid()
        )
    );

create or replace function public.customer_has_project_access(
    p_customer_id uuid,
    p_project_id text,
    p_permission text default 'view'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.customer_project_access a
        join public.customers c on c.id = a.customer_id
        where a.customer_id = p_customer_id
          and a.project_id = p_project_id
          and coalesce((a.permissions ->> 'view')::boolean, false) = true
          and (
              p_permission = 'view'
              or (
                  p_permission = 'comment'
                  and coalesce((a.permissions ->> 'comment')::boolean, false) = true
              )
              or (
                  p_permission = 'approve'
                  and coalesce((a.permissions ->> 'approve')::boolean, false) = true
              )
          )
          and (
              c.auth_user_id = auth.uid()
              or exists (
                  select 1
                  from public.organization_members m
                  where m.organization_id = c.organization_id
                    and m.user_id = auth.uid()
              )
          )
    );
$$;

create or replace function public.customer_load_project(
    p_customer_id uuid,
    p_project_id text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    project_json jsonb;
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'view') then
        raise exception 'Project access denied';
    end if;

    select p.document_json
    into project_json
    from public.projects p
    where p.id = p_project_id;

    return project_json;
end;
$$;

grant execute on function public.customer_has_project_access(uuid, text, text) to authenticated;
grant execute on function public.customer_load_project(uuid, text) to authenticated;
