begin;

create table public.gym_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    default auth.uid()
    references auth.users(id)
    on delete cascade,
  workout_day text not null,
  local_date date not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint gym_sessions_workout_day_check
    check (workout_day in ('day-1', 'day-2')),
  constraint gym_sessions_completed_at_check
    check (completed_at is null or completed_at >= started_at),
  constraint gym_sessions_id_user_id_key
    unique (id, user_id)
);

create unique index gym_sessions_one_active_per_user_idx
on public.gym_sessions (user_id)
where completed_at is null;

create index gym_sessions_user_date_started_idx
on public.gym_sessions (
  user_id,
  local_date desc,
  started_at desc
);

create table public.gym_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  exercise_id text not null,
  set_number smallint not null,
  reps_completed smallint,
  weight_kg numeric(7, 2),
  load_note text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),

  constraint gym_set_logs_session_user_fkey
    foreign key (session_id, user_id)
    references public.gym_sessions (id, user_id)
    on delete cascade,
  constraint gym_set_logs_session_exercise_set_key
    unique (session_id, exercise_id, set_number),
  constraint gym_set_logs_exercise_id_check
    check (
      length(btrim(exercise_id)) > 0
      and length(exercise_id) <= 100
    ),
  constraint gym_set_logs_set_number_check
    check (set_number > 0 and set_number <= 20),
  constraint gym_set_logs_reps_completed_check
    check (
      reps_completed is null
      or (reps_completed >= 1 and reps_completed <= 999)
    ),
  constraint gym_set_logs_weight_kg_check
    check (
      weight_kg is null
      or (weight_kg >= 0 and weight_kg <= 5000)
    ),
  constraint gym_set_logs_load_note_check
    check (
      load_note is null
      or (
        length(btrim(load_note)) > 0
        and length(load_note) <= 200
      )
    ),
  constraint gym_set_logs_completed_reps_check
    check (completed = false or reps_completed is not null)
);

create index gym_set_logs_user_exercise_created_idx
on public.gym_set_logs (
  user_id,
  exercise_id,
  created_at desc
);

alter table public.gym_sessions
enable row level security;

alter table public.gym_set_logs
enable row level security;

revoke all
on table
  public.gym_sessions,
  public.gym_set_logs
from public, anon, authenticated;

grant select, insert
on table public.gym_sessions
to authenticated;

grant update (completed_at)
on table public.gym_sessions
to authenticated;

grant select, insert
on table public.gym_set_logs
to authenticated;

grant update (
  reps_completed,
  weight_kg,
  load_note,
  completed
)
on table public.gym_set_logs
to authenticated;

create policy "Users can select their own gym sessions"
on public.gym_sessions
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Users can insert their own gym sessions"
on public.gym_sessions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Users can update their own gym sessions"
on public.gym_sessions
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy "Users can select their own gym set logs"
on public.gym_set_logs
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Users can insert their own gym set logs"
on public.gym_set_logs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Users can update their own gym set logs"
on public.gym_set_logs
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

commit;
