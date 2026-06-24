-- Organization roles and permission-aware RLS

alter table public.profiles
    add column if not exists display_name text;

alter table public.organization_members
    drop constraint if exists organization_members_role_check;

alter table public.organization_members
    add constraint organization_members_role_check
    check (role in ('owner', 'admin', 'sales', 'designer', 'production'));

update public.organization_members
set role = 'owner'
where role = 'admin';

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select organization_id
    from public.profiles
    where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select m.role
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.organization_id = public.current_user_organization_id()
    limit 1;
$$;

create or replace function public.role_has_permission(p_role text, p_permission text)
returns boolean
language plpgsql
immutable
as $$
begin
    if p_role in ('owner', 'admin') then
        return true;
    end if;

    case p_permission
        when 'projects.create' then
            return p_role in ('sales', 'designer');
        when 'projects.edit' then
            return p_role in ('sales', 'designer');
        when 'projects.delete' then
            return p_role in ('sales', 'designer');
        when 'projects.view' then
            return p_role in ('sales', 'designer', 'production');
        when 'quotes.create' then
            return p_role = 'sales';
        when 'quotes.export' then
            return p_role = 'sales';
        when 'manufacturing.view' then
            return p_role = 'production';
        when 'manufacturing.export' then
            return p_role = 'production';
        when 'settings.edit' then
            return false;
        else
            return false;
    end case;
end;
$$;

create or replace function public.current_user_can(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.role_has_permission(coalesce(public.current_user_role(), 'designer'), p_permission);
$$;

drop policy if exists "Organization members readable by self" on public.organization_members;

create policy "Organization members readable by organization peers"
    on public.organization_members for select
    using (
        organization_id = public.current_user_organization_id()
    );

create policy "Organization member roles manageable by owner or admin"
    on public.organization_members for update
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('owner', 'admin')
    )
    with check (
        organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('owner', 'admin')
    );

drop policy if exists "Company settings accessible by organization members" on public.company_settings;
drop policy if exists "Material catalogs accessible by organization members" on public.material_catalogs;

create policy "Company settings readable by organization members"
    on public.company_settings for select
    using (
        organization_id = public.current_user_organization_id()
    );

create policy "Company settings editable by owner or admin"
    on public.company_settings for insert
    with check (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    );

create policy "Company settings updatable by owner or admin"
    on public.company_settings for update
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    )
    with check (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    );

create policy "Company settings deletable by owner or admin"
    on public.company_settings for delete
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    );

create policy "Material catalogs readable by organization members"
    on public.material_catalogs for select
    using (
        organization_id = public.current_user_organization_id()
    );

create policy "Material catalogs editable by owner or admin"
    on public.material_catalogs for insert
    with check (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    );

create policy "Material catalogs updatable by owner or admin"
    on public.material_catalogs for update
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    )
    with check (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    );

create policy "Material catalogs deletable by owner or admin"
    on public.material_catalogs for delete
    using (
        organization_id = public.current_user_organization_id()
        and public.current_user_can('settings.edit')
    );

drop policy if exists "Projects are manageable by owner" on public.projects;

create policy "Projects readable by authorized members"
    on public.projects for select
    using (
        auth.uid() = user_id
        and public.current_user_can('projects.view')
    );

create policy "Projects insertable by authorized members"
    on public.projects for insert
    with check (
        auth.uid() = user_id
        and public.current_user_can('projects.create')
    );

create policy "Projects updatable by authorized members"
    on public.projects for update
    using (
        auth.uid() = user_id
        and public.current_user_can('projects.edit')
    )
    with check (
        auth.uid() = user_id
        and public.current_user_can('projects.edit')
    );

create policy "Projects deletable by authorized members"
    on public.projects for delete
    using (
        auth.uid() = user_id
        and public.current_user_can('projects.delete')
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

comment on function public.current_user_can is
    'Evaluates organization-level permissions for RLS policies.';
