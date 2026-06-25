-- Cloud-backed share links + customer portal self-registration.

-- 1) Share links -------------------------------------------------------------
-- Previously share links lived only in the creator's browser localStorage, so
-- they never worked on another device. Store them in Postgres and expose a
-- public (anonymous) read path via a security-definer RPC.

create table if not exists public.share_links (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations (id) on delete cascade,
    project_id text not null,
    share_token text not null unique,
    project_snapshot jsonb not null,
    permissions jsonb not null default '{"view": true, "duplicate": false}'::jsonb,
    created_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    expires_at timestamptz,
    disabled_at timestamptz
);

create index if not exists share_links_token_idx on public.share_links (share_token);
create index if not exists share_links_org_idx on public.share_links (organization_id);

alter table public.share_links enable row level security;

create policy "Share links manageable by organization members"
    on public.share_links for all
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = share_links.organization_id
              and m.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = share_links.organization_id
              and m.user_id = auth.uid()
        )
    );

-- Anonymous viewers fetch a single valid share via this function instead of
-- having direct table read access.
create or replace function public.load_share_link(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select to_jsonb(s) - 'organization_id' - 'created_by'
    from public.share_links s
    where s.share_token = p_token
      and s.disabled_at is null
      and (s.expires_at is null or s.expires_at > now())
      and coalesce((s.permissions ->> 'view')::boolean, true) = true
    limit 1;
$$;

revoke all on function public.load_share_link(text) from public;
grant execute on function public.load_share_link(text) to anon, authenticated;

-- 2) Customer portal self-registration --------------------------------------
-- Customers have no Supabase auth account until they register themselves, and
-- the invite-only trigger rejected every non-invited signup. Allow a signup
-- whose email matches an existing customer row, linking the auth user to that
-- customer (without granting organization membership).

create or replace function public.has_customer_account(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.customers
        where lower(email) = lower(trim(p_email))
    );
$$;

revoke all on function public.has_customer_account(text) from public;
grant execute on function public.has_customer_account(text) to anon, authenticated;

create or replace function public.ensure_user_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    invite_record record;
    customer_record record;
begin
    if new.organization_id is not null then
        return new;
    end if;

    -- Staff invite flow: attach the user to the inviting organization.
    select id, organization_id, role
    into invite_record
    from public.organization_invites
    where email = lower(trim(new.email))
      and accepted_at is null
    order by created_at desc
    limit 1;

    if found then
        insert into public.organization_members (organization_id, user_id, role)
        values (invite_record.organization_id, new.id, invite_record.role);

        update public.organization_invites
        set accepted_at = now()
        where id = invite_record.id;

        update public.profiles
        set organization_id = invite_record.organization_id
        where id = new.id;

        return new;
    end if;

    -- Customer portal flow: link to an existing unclaimed customer record.
    -- Customers are intentionally NOT organization members.
    select id
    into customer_record
    from public.customers
    where lower(email) = lower(trim(new.email))
      and auth_user_id is null
    order by created_at asc
    limit 1;

    if found then
        update public.customers
        set auth_user_id = new.id
        where id = customer_record.id;

        return new;
    end if;

    raise exception 'Registration requires an invitation';
end;
$$;
