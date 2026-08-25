-- Catálogo de plagas y regionalización. Mismo patrón que catalogo_enfermedades
-- (009_soja_enfermedades_v2.sql): las reglas en sí siguen viviendo en
-- reglas_agronomicas (con grupo_plaga/especie/tipo_regla seteados), reutilizando
-- el mismo motor y versionado. catalogo_plagas y plagas_regionales son entidades
-- propias porque la relación plaga↔zona cambia entre campañas y tiene su propio
-- ciclo de vida, independiente de la regla climática.

create table if not exists zonas_agronomicas (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null,
  definicion_geografica jsonb,             -- criterio provincial o polígono (PEND-10, sin definir todavía)
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalogo_plagas (
  id uuid primary key default gen_random_uuid(),
  cultivo text not null,
  grupo_plaga text not null,               -- 'trips','aranuela','orugas_defoliadoras','bolillera_spodoptera','chinches'
  especie text,                            -- permite reglas por especie sin romper el modelo
  nombre text not null,
  nombre_cientifico text,
  tipo_regla text not null check (tipo_regla in ('climatica','prioridad_monitoreo')),
  estado_catalogo text not null default 'catalogada' check (estado_catalogo in ('activa','catalogada','retirada')),
  version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- unique() de tabla no admite expresiones (coalesce); un índice único sí.
create unique index if not exists catalogo_plagas_identidad_idx
  on catalogo_plagas (cultivo, grupo_plaga, coalesce(especie,''), version);

create table if not exists plagas_regionales (
  id uuid primary key default gen_random_uuid(),
  plaga_id uuid not null references catalogo_plagas(id),
  zona_id uuid not null references zonas_agronomicas(id),
  prioridad text not null check (prioridad in ('principal','variable')),
  meses_desde integer check (meses_desde between 1 and 12),
  meses_hasta integer check (meses_hasta between 1 and 12),
  fuente_id text,
  fecha_fuente date,
  validado_por text,
  fecha_validacion timestamptz,
  vigencia_desde date not null default current_date,
  vigencia_hasta date,
  estado text not null default 'revisada' check (estado in ('borrador','revisada','vigente','retirada')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plagas_regionales_plaga_id_idx on plagas_regionales (plaga_id);
create index if not exists plagas_regionales_zona_id_idx on plagas_regionales (zona_id);
