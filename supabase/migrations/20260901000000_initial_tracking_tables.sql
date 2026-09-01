begin;

create table public.meal_item_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    default auth.uid()
    references auth.users(id)
    on delete cascade,
  log_date date not null,
  meal_id text not null,
  item_id text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),

  constraint meal_item_logs_meal_id_not_blank
    check (length(btrim(meal_id)) > 0),
  constraint meal_item_logs_item_id_not_blank
    check (length(btrim(item_id)) > 0),
  constraint meal_item_logs_user_date_meal_item_key
    unique (user_id, log_date, meal_id, item_id)
);

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    default auth.uid()
    references auth.users(id)
    on delete cascade,
  local_date date not null,
  amount_ml integer not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint water_entries_amount_ml_check
    check (amount_ml > 0 and amount_ml <= 5000)
);

create index water_entries_user_date_occurred_at_idx
on public.water_entries (
  user_id,
  local_date,
  occurred_at desc
);

alter table public.meal_item_logs
enable row level security;

alter table public.water_entries
enable row level security;

revoke all
on table
  public.meal_item_logs,
  public.water_entries
from public, anon, authenticated;

grant select, insert, update
on table public.meal_item_logs
to authenticated;

grant select, insert, delete
on table public.water_entries
to authenticated;

create policy "Users can select their own meal item logs"
on public.meal_item_logs
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Users can insert their own meal item logs"
on public.meal_item_logs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Users can update their own meal item logs"
on public.meal_item_logs
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy "Users can select their own water entries"
on public.water_entries
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Users can insert their own water entries"
on public.water_entries
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Users can delete their own water entries"
on public.water_entries
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

commit;
