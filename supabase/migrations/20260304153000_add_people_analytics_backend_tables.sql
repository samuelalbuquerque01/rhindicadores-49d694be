-- Goals configured for dashboard scope (global or per filial/user in future)
create table if not exists public.rh_goals (
  scope_key text primary key default 'global',
  filial_id uuid null references public.filiais(id) on delete set null,
  absenteeism_target numeric(6,2) not null default 2.5,
  turnover_target numeric(6,2) not null default 3.0,
  updated_by text not null default 'Usuario do sistema',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Institutional events (separate from operational table `eventos`)
create table if not exists public.institutional_events (
  id uuid primary key default gen_random_uuid(),
  filial_id uuid null references public.filiais(id) on delete set null,
  title text not null,
  type text not null,
  event_date date not null,
  location text null,
  organizer text null,
  sectors text[] not null default '{}'::text[],
  estimated_participants integer null check (estimated_participants is null or estimated_participants >= 0),
  description text null,
  tags text[] not null default '{}'::text[],
  attachments jsonb not null default '[]'::jsonb,
  audit_trail jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Extra metadata for trainings (tags, attachments and local audit snapshot)
create table if not exists public.training_extras (
  training_id uuid primary key references public.treinamentos(id) on delete cascade,
  tags text[] not null default '{}'::text[],
  attachments jsonb not null default '[]'::jsonb,
  audit_trail jsonb not null default '{}'::jsonb,
  snapshot jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Notification state per logical user key (no auth required for MVP)
create table if not exists public.smart_notification_state (
  id uuid primary key default gen_random_uuid(),
  user_key text not null default 'system',
  notification_id text not null,
  semantic_key text not null,
  read boolean not null default false,
  read_at timestamp with time zone null,
  hidden boolean not null default false,
  hidden_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_key, semantic_key)
);

-- RLS
alter table public.rh_goals enable row level security;
alter table public.institutional_events enable row level security;
alter table public.training_extras enable row level security;
alter table public.smart_notification_state enable row level security;

create policy "Acesso publico rh_goals" on public.rh_goals
  for all using (true) with check (true);

create policy "Acesso publico institutional_events" on public.institutional_events
  for all using (true) with check (true);

create policy "Acesso publico training_extras" on public.training_extras
  for all using (true) with check (true);

create policy "Acesso publico smart_notification_state" on public.smart_notification_state
  for all using (true) with check (true);

-- updated_at triggers
drop trigger if exists update_rh_goals_updated_at on public.rh_goals;
create trigger update_rh_goals_updated_at
before update on public.rh_goals
for each row execute function public.update_updated_at_column();

drop trigger if exists update_institutional_events_updated_at on public.institutional_events;
create trigger update_institutional_events_updated_at
before update on public.institutional_events
for each row execute function public.update_updated_at_column();

drop trigger if exists update_training_extras_updated_at on public.training_extras;
create trigger update_training_extras_updated_at
before update on public.training_extras
for each row execute function public.update_updated_at_column();

drop trigger if exists update_smart_notification_state_updated_at on public.smart_notification_state;
create trigger update_smart_notification_state_updated_at
before update on public.smart_notification_state
for each row execute function public.update_updated_at_column();

create index if not exists idx_institutional_events_event_date
  on public.institutional_events(event_date desc);

create index if not exists idx_institutional_events_type
  on public.institutional_events(type);

create index if not exists idx_smart_notification_state_user_key
  on public.smart_notification_state(user_key);

create index if not exists idx_smart_notification_state_user_notification
  on public.smart_notification_state(user_key, notification_id);
