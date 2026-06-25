-- In-app notifications for org staff + share_kind for guest handoff links.

alter table public.share_links
    add column if not exists share_kind text not null default 'customer_review'
        check (share_kind in ('customer_review', 'guest_handoff'));

create table if not exists public.organization_notifications (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    recipient_user_id uuid not null references auth.users (id) on delete cascade,
    type text not null,
    title text not null,
    body text not null,
    project_id text,
    review_id uuid references public.project_reviews (id) on delete set null,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists organization_notifications_recipient_idx
    on public.organization_notifications (recipient_user_id, read_at, created_at desc);

alter table public.organization_notifications enable row level security;

create policy "Users read own notifications"
    on public.organization_notifications for select
    using (recipient_user_id = auth.uid());

create policy "Users mark own notifications read"
    on public.organization_notifications for update
    using (recipient_user_id = auth.uid())
    with check (recipient_user_id = auth.uid());

create or replace function public.notify_organization_members(
    p_organization_id uuid,
    p_type text,
    p_title text,
    p_body text,
    p_project_id text default null,
    p_review_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.organization_notifications (
        organization_id,
        recipient_user_id,
        type,
        title,
        body,
        project_id,
        review_id
    )
    select
        p_organization_id,
        m.user_id,
        p_type,
        p_title,
        p_body,
        p_project_id,
        p_review_id
    from public.organization_members m
    where m.organization_id = p_organization_id;
end;
$$;

-- Notify all org members when a customer posts a review comment.
create or replace function public.review_add_comment_for_customer(
    p_customer_id uuid,
    p_project_id text,
    p_author_id text,
    p_message text,
    p_position jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    review_id uuid;
    org_id uuid;
    project_name text;
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'comment') then
        raise exception 'Comment permission denied';
    end if;

    if char_length(trim(p_message)) = 0 then
        raise exception 'Comment message is required';
    end if;

    select c.organization_id
    into org_id
    from public.customers c
    where c.id = p_customer_id;

    review_id := public.review_ensure_for_customer(p_customer_id, p_project_id);

    insert into public.review_comments (
        id,
        review_id,
        author_type,
        author_id,
        message,
        position_json
    )
    values (
        gen_random_uuid(),
        review_id,
        'customer',
        p_author_id,
        trim(p_message),
        p_position
    );

    update public.project_reviews
    set updated_at = now()
    where id = review_id;

    select coalesce(p.document_json ->> 'name', p_project_id)
    into project_name
    from public.projects p
    where p.id = p_project_id;

    if org_id is not null then
        perform public.notify_organization_members(
            org_id,
            'customer_comment',
            'New customer comment',
            coalesce(project_name, 'A project') || ': ' || left(trim(p_message), 180),
            p_project_id,
            review_id
        );
    end if;

    return public.review_row_to_json(review_id);
end;
$$;

-- Also notify when a customer approves or requests changes.
create or replace function public.review_update_status_for_customer(
    p_customer_id uuid,
    p_project_id text,
    p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    review_id uuid;
    org_id uuid;
    project_name text;
    notif_title text;
    notif_body text;
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'approve') then
        raise exception 'Approval permission denied';
    end if;

    if p_status not in ('changes_requested', 'approved') then
        raise exception 'Customers may only request changes or approve';
    end if;

    select c.organization_id
    into org_id
    from public.customers c
    where c.id = p_customer_id;

    review_id := public.review_ensure_for_customer(p_customer_id, p_project_id);

    update public.project_reviews
    set status = p_status,
        updated_at = now()
    where id = review_id;

    select coalesce(p.document_json ->> 'name', p_project_id)
    into project_name
    from public.projects p
    where p.id = p_project_id;

    if p_status = 'approved' then
        notif_title := 'Customer approved design';
        notif_body := coalesce(project_name, 'A project') || ' was approved by the customer.';
    else
        notif_title := 'Customer requested changes';
        notif_body := coalesce(project_name, 'A project') || ' needs revisions per the customer.';
    end if;

    if org_id is not null then
        perform public.notify_organization_members(
            org_id,
            'customer_review_status',
            notif_title,
            notif_body,
            p_project_id,
            review_id
        );
    end if;

    return public.review_row_to_json(review_id);
end;
$$;

revoke all on function public.notify_organization_members(uuid, text, text, text, text, uuid) from public;
grant execute on function public.notify_organization_members(uuid, text, text, text, text, uuid) to authenticated;
