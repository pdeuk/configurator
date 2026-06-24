-- Customer review and approval workflow (Supabase Postgres)

create table if not exists public.project_reviews (
    id uuid primary key default gen_random_uuid(),
    project_id text not null,
    share_token text unique,
    designer_user_id uuid references public.profiles (id) on delete set null,
    status text not null default 'draft'
        check (status in ('draft', 'sent', 'changes_requested', 'approved')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists project_reviews_project_id_idx
    on public.project_reviews (project_id);

create index if not exists project_reviews_share_token_idx
    on public.project_reviews (share_token);

create table if not exists public.review_comments (
    id uuid primary key default gen_random_uuid(),
    review_id uuid not null references public.project_reviews (id) on delete cascade,
    author_type text not null check (author_type in ('designer', 'customer')),
    author_id text not null,
    message text not null,
    created_at timestamptz not null default now(),
    position_json jsonb,
    resolved_at timestamptz
);

create index if not exists review_comments_review_id_idx
    on public.review_comments (review_id, created_at);

alter table public.project_reviews enable row level security;
alter table public.review_comments enable row level security;

create policy "Project reviews manageable by designer owner"
    on public.project_reviews for all
    using (
        auth.uid() = designer_user_id
        or exists (
            select 1
            from public.projects p
            where p.id = project_reviews.project_id
              and p.user_id = auth.uid()
        )
    )
    with check (
        auth.uid() = designer_user_id
        or exists (
            select 1
            from public.projects p
            where p.id = project_reviews.project_id
              and p.user_id = auth.uid()
        )
    );

create policy "Review comments manageable by designer owner"
    on public.review_comments for all
    using (
        exists (
            select 1
            from public.project_reviews r
            left join public.projects p on p.id = r.project_id
            where r.id = review_comments.review_id
              and (
                  r.designer_user_id = auth.uid()
                  or p.user_id = auth.uid()
              )
        )
    )
    with check (
        exists (
            select 1
            from public.project_reviews r
            left join public.projects p on p.id = r.project_id
            where r.id = review_comments.review_id
              and (
                  r.designer_user_id = auth.uid()
                  or p.user_id = auth.uid()
              )
        )
    );

create or replace function public.is_valid_share_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.project_shares s
        where s.token = p_token
          and s.disabled = false
          and s.expires_at > now()
    );
$$;

create or replace function public.review_row_to_json(p_review_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    review_row public.project_reviews%rowtype;
    comments_json jsonb;
begin
    select *
    into review_row
    from public.project_reviews
    where id = p_review_id;

    if not found then
        return null;
    end if;

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'authorType', c.author_type,
                'authorId', c.author_id,
                'message', c.message,
                'createdAt', c.created_at,
                'position', c.position_json,
                'resolvedAt', c.resolved_at
            )
            order by c.created_at asc
        ),
        '[]'::jsonb
    )
    into comments_json
    from public.review_comments c
    where c.review_id = p_review_id;

    return jsonb_build_object(
        'id', review_row.id,
        'projectId', review_row.project_id,
        'status', review_row.status,
        'createdAt', review_row.created_at,
        'updatedAt', review_row.updated_at,
        'comments', comments_json
    );
end;
$$;

create or replace function public.review_get_by_share_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    review_id uuid;
begin
    if not public.is_valid_share_token(p_token) then
        return null;
    end if;

    select r.id
    into review_id
    from public.project_reviews r
    where r.share_token = p_token
    order by r.updated_at desc
    limit 1;

    if review_id is null then
        return null;
    end if;

    return public.review_row_to_json(review_id);
end;
$$;

create or replace function public.review_add_comment_by_share_token(
    p_token text,
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
    comment_id uuid;
begin
    if not public.is_valid_share_token(p_token) then
        raise exception 'Invalid or expired share token';
    end if;

    if char_length(trim(p_message)) = 0 then
        raise exception 'Comment message is required';
    end if;

    select r.id
    into review_id
    from public.project_reviews r
    where r.share_token = p_token
    order by r.updated_at desc
    limit 1;

    if review_id is null then
        raise exception 'Review not found for share token';
    end if;

    comment_id := gen_random_uuid();

    insert into public.review_comments (
        id,
        review_id,
        author_type,
        author_id,
        message,
        position_json
    )
    values (
        comment_id,
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

create or replace function public.review_update_status_by_share_token(
    p_token text,
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
    if not public.is_valid_share_token(p_token) then
        raise exception 'Invalid or expired share token';
    end if;

    if p_status not in ('changes_requested', 'approved') then
        raise exception 'Customers may only request changes or approve';
    end if;

    select r.id
    into review_id
    from public.project_reviews r
    where r.share_token = p_token
    order by r.updated_at desc
    limit 1;

    if review_id is null then
        raise exception 'Review not found for share token';
    end if;

    update public.project_reviews
    set status = p_status,
        updated_at = now()
    where id = review_id;

    return public.review_row_to_json(review_id);
end;
$$;

-- Reserved for email notifications (trigger stub)
create or replace function public.review_notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Hook point for email notifications / customer portal events.
    return new;
end;
$$;

drop trigger if exists project_reviews_notify_status_change on public.project_reviews;

create trigger project_reviews_notify_status_change
    after update of status on public.project_reviews
    for each row
    when (old.status is distinct from new.status)
    execute function public.review_notify_status_change();

-- Reserved for revision history snapshots
comment on table public.project_reviews is
    'Customer review workflow. Extend with revision snapshots for portal history.';
