-- Organization analytics events (separate from project documents)

create table if not exists public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    user_id text,
    event text not null,
    entity_type text not null,
    entity_id text not null,
    metadata jsonb not null default '{}'::jsonb,
    timestamp timestamptz not null default now()
);

create index if not exists analytics_events_organization_id_idx
    on public.analytics_events (organization_id);

create index if not exists analytics_events_organization_timestamp_idx
    on public.analytics_events (organization_id, timestamp desc);

create index if not exists analytics_events_event_idx
    on public.analytics_events (organization_id, event);

alter table public.analytics_events enable row level security;

create policy "Analytics events readable by organization members"
    on public.analytics_events for select
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = analytics_events.organization_id
              and m.user_id = auth.uid()
        )
    );

create policy "Analytics events insertable by organization members"
    on public.analytics_events for insert
    with check (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = analytics_events.organization_id
              and m.user_id = auth.uid()
        )
    );

create policy "Analytics events deletable by organization members"
    on public.analytics_events for delete
    using (
        exists (
            select 1
            from public.organization_members m
            where m.organization_id = analytics_events.organization_id
              and m.user_id = auth.uid()
        )
    );
