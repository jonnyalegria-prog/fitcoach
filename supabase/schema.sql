-- FitCoach · esquema de base de datos (ya aplicado al proyecto Supabase "fitcoach")
-- Se guarda aquí como respaldo / para recrear el proyecto.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  assessment jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  active boolean not null default true,
  source text not null default 'generated',
  created_at timestamptz not null default now()
);
create unique index plans_one_active_per_user on public.plans(user_id) where active;

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  day_label text not null default '',
  started_at timestamptz not null default now(),
  duration_min int,
  rpe numeric,
  kcal int,
  notes text,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index workout_logs_user_started on public.workout_logs(user_id, started_at desc);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric,
  calories int,
  energy int,
  soreness int,
  sleep_h numeric,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.exercise_prefs (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  pref text not null check (pref in ('avoid','like')),
  primary key (user_id, exercise_id)
);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.workout_logs enable row level security;
alter table public.checkins enable row level security;
alter table public.exercise_prefs enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own plans" on public.plans for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own logs" on public.workout_logs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own checkins" on public.checkins for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own prefs" on public.exercise_prefs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Solo 2 usuarios en total + confirmación automática de correo
create or replace function public.limit_two_users() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from auth.users) >= 2 then
    raise exception 'Esta app es solo para 2 usuarios';
  end if;
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;
create trigger limit_two_users before insert on auth.users
  for each row execute function public.limit_two_users();

-- Perfil automático al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.limit_two_users() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Registro sin correo de confirmación (el servicio de correo gratuito de Supabase
-- solo entrega a miembros de la organización, lo que bloquearía a la 2.ª persona).
create or replace function public.create_account(p_name text, p_email text, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := gen_random_uuid();
  em text := lower(trim(coalesce(p_email, '')));
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Escribe un correo válido.'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres.'; end if;
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'Ese correo ya tiene cuenta. Inicia sesión.'; end if;
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, reauthentication_token, phone_change, phone_change_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', left(trim(coalesce(p_name, '')), 30), 'email_verified', true),
    now(), now(), '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, 'email',
    jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), now(), now(), now());
end $$;
revoke all on function public.create_account(text, text, text) from public;
grant execute on function public.create_account(text, text, text) to anon, authenticated;
