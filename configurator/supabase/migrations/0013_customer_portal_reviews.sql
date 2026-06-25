-- Customer portal: read/write reviews via security-definer RPCs (bypasses designer-only RLS).
-- Also updates share-token validation to use the new share_links table.

create or replace function public.is_valid_share_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.share_links s
        where s.share_token = p_token
          and s.disabled_at is null
          and (s.expires_at is null or s.expires_at > now())
          and coalesce((s.permissions ->> 'view')::boolean, true) = true
    )
    or exists (
        select 1
        from public.project_shares s
        where s.token = p_token
          and s.disabled = false
          and s.expires_at > now()
    );
$$;

create or replace function public.review_ensure_for_customer(
    p_customer_id uuid,
    p_project_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    review_id uuid;
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'view') then
        raise exception 'Project access denied';
    end if;

    select r.id
    into review_id
    from public.project_reviews r
    where r.project_id = p_project_id
    order by r.updated_at desc
    limit 1;

    if review_id is not null then
        return review_id;
    end if;

    review_id := gen_random_uuid();

    insert into public.project_reviews (
        id,
        project_id,
        status,
        created_at,
        updated_at
    )
    values (
        review_id,
        p_project_id,
        'sent',
        now(),
        now()
    );

    return review_id;
end;
$$;

create or replace function public.review_get_for_customer(
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
    review_id uuid;
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'view') then
        raise exception 'Project access denied';
    end if;

    select r.id
    into review_id
    from public.project_reviews r
    where r.project_id = p_project_id
    order by r.updated_at desc
    limit 1;

    if review_id is null then
        return null;
    end if;

    return public.review_row_to_json(review_id);
end;
$$;

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
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'comment') then
        raise exception 'Comment permission denied';
    end if;

    if char_length(trim(p_message)) = 0 then
        raise exception 'Comment message is required';
    end if;

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

    return public.review_row_to_json(review_id);
end;
$$;

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
begin
    if not public.customer_has_project_access(p_customer_id, p_project_id, 'approve') then
        raise exception 'Approval permission denied';
    end if;

    if p_status not in ('changes_requested', 'approved') then
        raise exception 'Customers may only request changes or approve';
    end if;

    review_id := public.review_ensure_for_customer(p_customer_id, p_project_id);

    update public.project_reviews
    set status = p_status,
        updated_at = now()
    where id = review_id;

    return public.review_row_to_json(review_id);
end;
$$;

revoke all on function public.review_get_for_customer(uuid, text) from public;
revoke all on function public.review_add_comment_for_customer(uuid, text, text, text, jsonb) from public;
revoke all on function public.review_update_status_for_customer(uuid, text, text) from public;

grant execute on function public.review_get_for_customer(uuid, text) to authenticated;
grant execute on function public.review_add_comment_for_customer(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.review_update_status_for_customer(uuid, text, text) to authenticated;
