-- Remove the legacy open read policy on project_shares.
-- Newer share links use public.load_share_link(token) against share_links;
-- project_shares should only be accessible through owner/member policies.

drop policy if exists "Project shares readable by token lookup"
    on public.project_shares;
