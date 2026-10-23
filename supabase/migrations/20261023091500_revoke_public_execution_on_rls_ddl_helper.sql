-- Public PostgREST clients must not call the DDL event-trigger helper directly.
-- The event trigger itself remains attached to DDL events, which use the owner privilege.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
