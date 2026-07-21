-- Allow organization staff to download original artwork files referenced in
-- projects owned by colleagues in the same organization. Customers are not
-- organization members and remain blocked by these policies.

create or replace function public.staff_can_read_artwork_asset(p_asset_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.projects p
        join public.organization_members owner_m
            on owner_m.user_id = p.user_id
        join public.organization_members reader_m
            on reader_m.organization_id = owner_m.organization_id
           and reader_m.user_id = auth.uid()
        cross join lateral jsonb_array_elements(
            coalesce(p.document_json->'artworkAssets', '[]'::jsonb)
        ) as asset_elem
        where asset_elem->>'id' = p_asset_id
    );
$$;

revoke all on function public.staff_can_read_artwork_asset(text) from public;
grant execute on function public.staff_can_read_artwork_asset(text) to authenticated;

create policy "Artwork assets readable by org staff for project artwork"
    on public.artwork_assets for select
    using (
        auth.uid() = user_id
        or public.staff_can_read_artwork_asset(id::text)
    );

create policy "Artwork objects readable by org staff for project artwork"
    on storage.objects for select
    using (
        bucket_id = 'project-artwork'
        and exists (
            select 1
            from public.artwork_assets aa
            where aa.storage_path = name
              and public.staff_can_read_artwork_asset(aa.id::text)
        )
    );
