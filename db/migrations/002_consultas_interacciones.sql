create table if not exists consultas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  share_token text not null unique,
  session_id text,
  localidad_input text not null,
  localidad_normalizada text not null,
  provincia text,
  cultivo text not null,
  fecha_siembra date,
  estado_general text not null check (
    estado_general in (
      'Atención recomendada',
      'Monitoreo preventivo sugerido',
      'Sin alertas activas'
    )
  ),
  confianza text not null check (confianza in ('Alta', 'Media', 'Baja')),
  dias_datos integer not null check (dias_datos >= 0),
  datos_climaticos_usados jsonb not null,
  reglas_evaluadas jsonb not null default '[]'::jsonb,
  resultado jsonb not null,
  versiones_reglas text[] not null default '{}'
);

create index if not exists consultas_session_created_idx
  on consultas (session_id, created_at desc);

create index if not exists consultas_localidad_cultivo_created_idx
  on consultas (localidad_normalizada, cultivo, created_at desc);

create table if not exists interesados (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consulta_id uuid references consultas(id) on delete set null,
  session_id text,
  email text not null,
  localidad text,
  cultivo text,
  activo boolean not null default true,
  origen text not null default 'resultado',
  check (position('@' in email) > 1)
);

create index if not exists interesados_email_idx
  on interesados (lower(email));

create index if not exists interesados_consulta_idx
  on interesados (consulta_id);

create table if not exists observaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  consulta_id uuid references consultas(id) on delete cascade,
  session_id text,
  opciones text[] not null default '{}',
  detalle text,
  origen text not null default 'resultado',
  check (array_length(opciones, 1) is not null or nullif(trim(coalesce(detalle, '')), '') is not null)
);

create index if not exists observaciones_consulta_idx
  on observaciones (consulta_id);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  consulta_id uuid references consultas(id) on delete cascade,
  session_id text,
  utilidad text check (utilidad in ('si', 'parcialmente', 'no')),
  observaciones text[] not null default '{}',
  sugerencia text,
  origen text not null default 'resultado',
  check (
    utilidad is not null
    or array_length(observaciones, 1) is not null
    or nullif(trim(coalesce(sugerencia, '')), '') is not null
  )
);

create index if not exists feedback_consulta_idx
  on feedback (consulta_id);
