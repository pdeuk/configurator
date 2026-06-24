-- Organization email invites and signup join flow

create table if not exists public.organization_invites (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    email text not null,
    role text not null,
    invited_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    accepted_at timestamptz,
    constraint organization_invites_role_check
        check (role in ('admin', 'sales', 'designer', 'production')),
    constraint organization_invites_email_trimmed_check
        check (email = lower(trim(email)))
);

create unique index if not exists organization_invites_org_email_pending_idx
    on public.organization_invites (organization_id, email)
    where accepted_at is null;

create index if not exists organization_invites_email_idx
    on public.organization_invites (email);

alter table public.organization_invites enable row level security;

create policy "Organization invites readable by org admins"
    on public.organization_invites for select
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('owner', 'admin')
    );

create policy "Organization invites insertable by org admins"
    on public.organization_invites for insert
    with check (
        organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('owner', 'admin')
        and invited_by = auth.uid()
    );

create policy "Organization invites deletable by org admins"
    on public.organization_invites for delete
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('owner', 'admin')
    );

create or replace function public.ensure_user_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    org_id uuid;
    invite_record record;
begin
    if new.organization_id is not null then
        return new;
    end if;

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

        new.organization_id := invite_record.organization_id;
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

create or replace function public.claim_pending_organization_invite()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    invite_record record;
    user_email text;
    current_org_id uuid;
begin
    select email, organization_id
    into user_email, current_org_id
    from public.profiles
    where id = auth.uid();

    if user_email is null then
        return false;
    end if;

    select id, organization_id, role
    into invite_record
    from public.organization_invites
    where email = lower(trim(user_email))
      and accepted_at is null
    order by created_at desc
    limit 1;

    if not found then
        return false;
    end if;

    if current_org_id = invite_record.organization_id then
        update public.organization_invites
        set accepted_at = coalesce(accepted_at, now())
        where id = invite_record.id;
        return true;
    end if;

    insert into public.organization_members (organization_id, user_id, role)
    values (invite_record.organization_id, auth.uid(), invite_record.role)
    on conflict (organization_id, user_id) do update
        set role = excluded.role;

    update public.profiles
    set organization_id = invite_record.organization_id
    where id = auth.uid();

    update public.organization_invites
    set accepted_at = now()
    where id = invite_record.id;

    return true;
end;
$$;

create policy "Organization members removable by owner or admin"
    on public.organization_members for delete
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('owner', 'admin')
        and user_id <> auth.uid()
        and role <> 'owner'
    );

grant execute on function public.claim_pending_organization_invite() to authenticated;
