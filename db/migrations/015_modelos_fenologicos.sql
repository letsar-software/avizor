-- Fenología parametrizable (plan de arquitectura, sección 3.3, fase 6). Antes vivía
-- hardcodeada en lib/phenology/provider.ts; pasa a ser dato administrable, mismo
-- patrón de versionado que reglas_agronomicas (experimental → revisada → vigente → retirada).

create table if not exists modelos_fenologicos (
  id uuid primary key default gen_random_uuid(),
  cultivo text not null,
  version text not null,
  estado text not null default 'experimental' check (estado in ('experimental', 'revisada', 'vigente', 'retirada')),
  proveedor text not null default 'propio',
  parametros jsonb not null,
  fuente_tecnica text,
  validado_por text,
  validado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cultivo, version)
);

-- Semilla: exactamente el modelo que ya estaba hardcodeado, promovido a vigente
-- directamente para no cambiar el comportamiento de producción al migrar a datos.
insert into modelos_fenologicos (cultivo, version, estado, proveedor, parametros, fuente_tecnica, validado_por, validado_en)
values (
  'soja', '1.0', 'vigente', 'propio',
  '{
    "hitos": [
      {"codigo":"E","nombre":"Emergencia"},
      {"codigo":"R1","nombre":"Inicio de floración"},
      {"codigo":"R3","nombre":"Inicio de formación de vainas"},
      {"codigo":"R5","nombre":"Inicio de llenado de granos"},
      {"codigo":"R7","nombre":"Inicio de madurez fisiológica"}
    ],
    "offsets_dias": {
      "III": [7, 52, 72, 94, 132],
      "IV corto": [8, 58, 79, 104, 144],
      "IV largo": [8, 64, 87, 114, 154],
      "V": [9, 70, 95, 125, 165]
    },
    "margen_dias": 4
  }'::jsonb,
  'Modelo calendario original de Avizor (lib/phenology/provider.ts v1.0), migrado a dato administrable sin cambiar coeficientes.',
  'migration-015', now()
)
on conflict (cultivo, version) do nothing;
