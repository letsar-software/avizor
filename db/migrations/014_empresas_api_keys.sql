-- Empresas / API (plan de arquitectura, sección 6, fase 5). Hoy api_keys/api_uso
-- existen pero no hay entidad "empresa" ni forma administrable de crear una key:
-- solo se podía insertar a mano. Esta migración agrega la entidad y liga las keys
-- existentes a ella.

create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto_nombre text,
  contacto_email text,
  estado text not null default 'activa' check (estado in ('activa', 'inactiva')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table api_keys add column if not exists empresa_id uuid references empresas(id);
alter table api_keys add column if not exists scopes text[] not null default '{}';

create index if not exists api_keys_empresa_id_idx on api_keys (empresa_id);
