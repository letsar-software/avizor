-- Avisos técnicos temporales y configurables. No inserta datos productivos ni
-- modifica reglas existentes; ejecutar sólo después de la revisión funcional.
create table if not exists agronomic_advisories (
  id uuid primary key default gen_random_uuid(),
  crop_id text references cultivos(clave) on update cascade,
  category_id uuid not null references categorias_agronomicas(id),
  scope_type text not null check (scope_type in ('global', 'region', 'farm', 'field')),
  scope_id text,
  status text not null check (status in ('informativo', 'vigilancia', 'moderado', 'alto', 'critico')),
  title text not null,
  message text not null,
  recommended_action text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  active boolean not null default true,
  priority integer not null default 0,
  source_type text not null check (source_type in ('agronomic_validation', 'official_alert', 'field_observation', 'technical_report')),
  source_name text not null,
  source_url text,
  validated_by text not null,
  reviewed_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope_type = 'global' and scope_id is null) or (scope_type <> 'global' and scope_id is not null)),
  check (ends_at is null or ends_at >= starts_at)
);
create index if not exists agronomic_advisories_applicability_idx
  on agronomic_advisories (active, category_id, crop_id, starts_at, ends_at, priority desc);
create index if not exists agronomic_advisories_scope_idx
  on agronomic_advisories (scope_type, scope_id) where active = true;
