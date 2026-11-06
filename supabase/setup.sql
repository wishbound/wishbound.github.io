-- Wishbound sync: run this once in Supabase (SQL Editor > New query > paste > Run).
-- Data is stored by sync code. The table can't be read directly; only these two functions can use it.
create table if not exists public.wb_sync (
  code text primary key,
  data jsonb not null,
  updated_at bigint not null,
  touched timestamptz not null default now()
);
alter table public.wb_sync enable row level security;

create or replace function public.wb_get(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('data', data, 'updated_at', updated_at) from wb_sync where code = p_code;
$$;

create or replace function public.wb_put(p_code text, p_data jsonb, p_updated bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^LADS-[A-Z0-9]{4}-[A-Z0-9]{4}$' then raise exception 'bad code'; end if;
  if octet_length(p_data::text) > 1000000 then raise exception 'too big'; end if;
  insert into wb_sync (code, data, updated_at, touched) values (p_code, p_data, p_updated, now())
  on conflict (code) do update set data = excluded.data, updated_at = excluded.updated_at, touched = now()
  where wb_sync.updated_at <= excluded.updated_at;
end $$;

revoke all on public.wb_sync from anon, authenticated;
grant execute on function public.wb_get(text) to anon;
grant execute on function public.wb_put(text, jsonb, bigint) to anon;
