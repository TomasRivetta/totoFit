-- Crear tabla de perfiles de usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamp with time zone default now()
);

-- Crear tabla de entrenamientos completados
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- Crear tabla de ejercicios
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  media_url text,
  sets integer not null,
  reps integer not null,
  weight numeric(10, 2),
  order_index integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;

-- Políticas RLS para profiles
create policy "users_select_own_profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users_insert_own_profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users_update_own_profile" on public.profiles
  for update using (auth.uid() = id);

-- Políticas RLS para workouts
create policy "users_select_own_workouts" on public.workouts
  for select using (auth.uid() = user_id);

create policy "users_insert_own_workouts" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "users_update_own_workouts" on public.workouts
  for update using (auth.uid() = user_id);

create policy "users_delete_own_workouts" on public.workouts
  for delete using (auth.uid() = user_id);

-- Políticas RLS para exercises
create policy "users_select_own_exercises" on public.exercises
  for select using (
    exists (
      select 1 from public.workouts
      where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "users_insert_own_exercises" on public.exercises
  for insert with check (
    exists (
      select 1 from public.workouts
      where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "users_update_own_exercises" on public.exercises
  for update using (
    exists (
      select 1 from public.workouts
      where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "users_delete_own_exercises" on public.exercises
  for delete using (
    exists (
      select 1 from public.workouts
      where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

-- Crear índices para mejorar el rendimiento
create index if not exists idx_workouts_user_id on public.workouts(user_id);
create index if not exists idx_workouts_date on public.workouts(workout_date);
create index if not exists idx_exercises_workout_id on public.exercises(workout_id);

