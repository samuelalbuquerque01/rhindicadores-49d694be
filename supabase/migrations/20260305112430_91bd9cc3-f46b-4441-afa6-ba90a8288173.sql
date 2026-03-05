
-- 1. institutional_events table
CREATE TABLE public.institutional_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Outro',
  event_date date NOT NULL,
  location text,
  organizer text,
  sectors text[] NOT NULL DEFAULT '{}',
  estimated_participants integer,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]',
  audit_trail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.institutional_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público institutional_events" ON public.institutional_events FOR ALL USING (true) WITH CHECK (true);

-- 2. training_extras table
CREATE TABLE public.training_extras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id text NOT NULL UNIQUE,
  tags text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]',
  audit_trail jsonb NOT NULL DEFAULT '{}',
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público training_extras" ON public.training_extras FOR ALL USING (true) WITH CHECK (true);

-- 3. rh_goals table
CREATE TABLE public.rh_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_key text NOT NULL UNIQUE,
  absenteeism_target numeric NOT NULL DEFAULT 2.5,
  turnover_target numeric NOT NULL DEFAULT 3,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rh_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público rh_goals" ON public.rh_goals FOR ALL USING (true) WITH CHECK (true);

-- 4. smart_notification_state table
CREATE TABLE public.smart_notification_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_key text NOT NULL,
  notification_id text NOT NULL,
  semantic_key text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  hidden boolean NOT NULL DEFAULT false,
  hidden_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_key, semantic_key)
);

ALTER TABLE public.smart_notification_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público smart_notification_state" ON public.smart_notification_state FOR ALL USING (true) WITH CHECK (true);

-- 5. hr_events table (for people events registry)
CREATE TABLE public.hr_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  employee_id uuid,
  employee_name text NOT NULL DEFAULT 'Nao informado',
  sector_id text,
  sector_name text NOT NULL DEFAULT 'Nao informado',
  start_date date NOT NULL,
  end_date date,
  reason text NOT NULL DEFAULT 'Nao informado',
  notes text NOT NULL DEFAULT '',
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público hr_events" ON public.hr_events FOR ALL USING (true) WITH CHECK (true);
