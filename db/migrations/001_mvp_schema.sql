create extension if not exists pgcrypto;

create table if not exists reglas_agronomicas (
  id uuid primary key default gen_random_uuid(),
  cultivo text not null,
  categoria_nombre text not null,
  condicion text not null check (condicion in ('favorable', 'moderada', 'desfavorable')),
  causas text[] not null default '{}',
  recomendacion text not null,
  regla_version text not null,
  prioridad integer not null default 0,
  activa boolean not null default true,
  combinador text not null default 'all' check (combinador in ('all', 'any')),
  condiciones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reglas_agronomicas_cultivo_activa_idx
  on reglas_agronomicas (cultivo, activa, prioridad desc);

create table if not exists consulta_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  localidad text not null,
  cultivo text not null,
  session_id text,
  fecha_siembra date,
  datos_climaticos_usados jsonb,
  reglas_evaluadas jsonb not null default '[]'::jsonb,
  resultado jsonb,
  versiones_reglas text[] not null default '{}',
  error text
);

insert into reglas_agronomicas (
  cultivo,
  categoria_nombre,
  condicion,
  causas,
  recomendacion,
  regla_version,
  prioridad,
  combinador,
  condiciones
) values
  (
    'soja',
    'enfermedades_foliares',
    'favorable',
    array['humedad_alta', 'lluvia_reciente', 'temperatura_media'],
    'Monitorear el lote durante los prÃ³ximos 5 dÃ­as.',
    'v1.0',
    300,
    'all',
    '[{"metric":"humedad_media_14d","operator":">=","value":85},{"metric":"lluvia_5d_mm","operator":">=","value":50},{"metric":"temp_media_14d","operator":">=","value":18},{"metric":"temp_media_14d","operator":"<=","value":26}]'::jsonb
  ),
  (
    'soja',
    'enfermedades_foliares',
    'moderada',
    array['humedad_media', 'lluvia_reciente'],
    'Continuar el seguimiento y revisar sectores bajos o con mayor humedad.',
    'v1.0',
    200,
    'all',
    '[{"metric":"humedad_media_14d","operator":">=","value":75},{"metric":"lluvia_5d_mm","operator":">=","value":20}]'::jsonb
  ),
  (
    'soja',
    'enfermedades_foliares',
    'desfavorable',
    array['humedad_baja', 'lluvia_limitada'],
    'Mantener monitoreo habitual del lote.',
    'v1.0',
    100,
    'all',
    '[]'::jsonb
  ),
  (
    'soja',
    'estres_hidrico',
    'favorable',
    array['lluvia_baja', 'temperatura_media_alta'],
    'Revisar disponibilidad de agua y observar sÃ­ntomas de estrÃ©s en sectores representativos.',
    'v1.0',
    300,
    'all',
    '[{"metric":"lluvia_7d_mm","operator":"<=","value":5},{"metric":"temp_media_14d","operator":">=","value":28}]'::jsonb
  ),
  (
    'soja',
    'estres_hidrico',
    'moderada',
    array['lluvia_baja_7d'],
    'Observar evoluciÃ³n del lote y registrar cambios visibles.',
    'v1.0',
    200,
    'all',
    '[{"metric":"lluvia_7d_mm","operator":"<=","value":15}]'::jsonb
  ),
  (
    'soja',
    'estres_hidrico',
    'desfavorable',
    array['lluvia_suficiente'],
    'Sin seÃ±ales climÃ¡ticas relevantes para estrÃ©s hÃ­drico en este perÃ­odo.',
    'v1.0',
    100,
    'all',
    '[]'::jsonb
  ),
  (
    'soja',
    'heladas',
    'favorable',
    array['temperatura_baja'],
    'Revisar pronÃ³stico local y observar sectores bajos del lote.',
    'v1.0',
    300,
    'all',
    '[{"metric":"temp_min_14d","operator":"<=","value":2}]'::jsonb
  ),
  (
    'soja',
    'heladas',
    'desfavorable',
    array['temperatura_sin_umbral_critico'],
    'Sin seÃ±ales climÃ¡ticas relevantes para heladas en este perÃ­odo.',
    'v1.0',
    100,
    'all',
    '[]'::jsonb
  )
on conflict do nothing;

