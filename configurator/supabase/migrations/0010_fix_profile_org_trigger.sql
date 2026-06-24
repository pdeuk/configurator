-- Fix signup 500: organization_members referenced profiles before the row existed.
-- Run ensure_user_organization AFTER the profile insert instead of BEFORE.

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

        update public.profiles
        set organization_id = invite_record.organization_id
        where id = new.id;

        return new;
    end if;

    insert into public.organizations (name)
    values (split_part(new.email, '@', 1))
    returning id into org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (org_id, new.id, 'owner');

    update public.profiles
    set organization_id = org_id
    where id = new.id;

    return new;
end;
$$;

drop trigger if exists profiles_ensure_organization on public.profiles;

create trigger profiles_ensure_organization
    after insert on public.profiles
    for each row execute function public.ensure_user_organization();
