-- Invite-only registration for organization workspace members.

create or replace function public.has_pending_organization_invite(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.organization_invites
        where email = lower(trim(p_email))
          and accepted_at is null
    );
$$;

revoke all on function public.has_pending_organization_invite(text) from public;
grant execute on function public.has_pending_organization_invite(text) to anon, authenticated;

create or replace function public.ensure_user_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
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

    if not found then
        raise exception 'Registration requires an invitation';
    end if;

    insert into public.organization_members (organization_id, user_id, role)
    values (invite_record.organization_id, new.id, invite_record.role);

    update public.organization_invites
    set accepted_at = now()
    where id = invite_record.id;

    update public.profiles
    set organization_id = invite_record.organization_id
    where id = new.id;

    return new;
end;
$$;
