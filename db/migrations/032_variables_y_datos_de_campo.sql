-- Catálogo administrable de variables agronómicas, lotes y datos de campo por lote.
-- Genérico: ninguna variable ni dato está atado a un cultivo; las reglas declaran
-- qué variables son críticas o complementarias. Idempotente. No ejecutar sin revisión.
-- La semilla replica BASE_VARIABLES (lib/variables/catalog.ts); un test verifica que coincidan.

create table if not exists variables_agronomicas (
  clave text primary key check (clave ~ '^[a-z][a-z0-9_]{1,62}$'),
  etiqueta text not null,
  descripcion text not null default '',
  unidad text,
  tipo_valor text not null check (tipo_valor in ('numero', 'texto', 'booleano', 'opcion', 'fecha')),
  origen text not null check (origen in ('clima', 'fenologia', 'campo', 'modelo')),
  proveedores text[] not null default '{}',
  vigencia_dias integer check (vigencia_dias is null or vigencia_dias > 0),
  activa boolean not null default true,
  creado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Semilla: sólo inserta las que faltan; nunca pisa ediciones hechas desde administración.
insert into variables_agronomicas (clave, etiqueta, descripcion, unidad, tipo_valor, origen, proveedores, vigencia_dias) values
  ('temperatura_media', 'Temperatura media del lote o estación cercana', 'Promedio diario de temperatura del aire.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('temperatura_min', 'Temperatura mínima del lote o estación cercana', 'Mínima diaria de temperatura del aire.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('temperatura_max', 'Temperatura máxima del lote o estación cercana', 'Máxima diaria de temperatura del aire.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('humedad_relativa', 'Humedad relativa del lote o estación cercana', 'Humedad relativa media diaria.', '%', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('precipitacion', 'Precipitaciones y riegos recientes', 'Lluvia diaria acumulada.', 'mm', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('viento_medio', 'Velocidad del viento', 'Viento medio diario a 10 m.', 'km/h', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('punto_rocio', 'Punto de rocío', 'Temperatura de rocío media diaria.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('deficit_presion_vapor', 'Déficit de presión de vapor', 'DPV medio diario.', 'kPa', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('evapotranspiracion', 'Evapotranspiración', 'Evapotranspiración diaria estimada.', 'mm', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('et0_fao_56', 'Evapotranspiración de referencia', 'ET0 FAO-56 diaria.', 'mm', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('humedad_suelo_0_1cm', 'Humedad de suelo o balance hídrico', 'Humedad volumétrica 0–1 cm. Un dato medido en el lote prevalece sobre la estimación.', 'm³/m³', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('humedad_suelo_1_3cm', 'Humedad de suelo o balance hídrico', 'Humedad volumétrica 1–3 cm.', 'm³/m³', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('humedad_suelo_3_9cm', 'Humedad de suelo o balance hídrico', 'Humedad volumétrica 3–9 cm.', 'm³/m³', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('humedad_suelo_9_27cm', 'Humedad de suelo o balance hídrico', 'Humedad volumétrica 9–27 cm.', 'm³/m³', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('humedad_suelo_27_81cm', 'Humedad de suelo o balance hídrico', 'Humedad volumétrica 27–81 cm.', 'm³/m³', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('temperatura_suelo_0cm', 'Temperatura de suelo', 'Temperatura de suelo en superficie.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('temperatura_suelo_6cm', 'Temperatura de suelo', 'Temperatura de suelo a 6 cm.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('temperatura_suelo_18cm', 'Temperatura de suelo', 'Temperatura de suelo a 18 cm.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('temperatura_suelo_54cm', 'Temperatura de suelo', 'Temperatura de suelo a 54 cm.', '°C', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('radiacion_solar', 'Radiación solar', 'Radiación de onda corta media diaria.', 'W/m²', 'numero', 'clima', array['open_meteo']::text[], 1),
  ('leaf_wetness_hours', 'Horas de mojado foliar medidas o calculadas por un modelo calibrado', 'Horas diarias con hoja mojada. Open-Meteo no las provee: requieren sensor o modelo calibrado.', 'h', 'numero', 'clima', '{}'::text[], 1),
  ('codigo_zadoks', 'Etapa fenológica actual', 'Etapa del cultivo (Zadoks u otra escala configurada), informada o estimada.', null, 'numero', 'fenologia', '{}'::text[], 10),
  ('cultivar', 'Cultivar sembrado', 'Nombre comercial del cultivar del lote.', null, 'texto', 'campo', '{}'::text[], null),
  ('cultivar_susceptibilidad', 'Cultivar y susceptibilidad', 'Susceptibilidad varietal a la enfermedad o plaga evaluada.', null, 'opcion', 'campo', '{}'::text[], null),
  ('observacion_manual', 'Observaciones de campo', 'Síntomas, presencia o daño observados en el lote.', null, 'texto', 'campo', '{}'::text[], 7),
  ('estado_drenaje', 'Estado de drenaje del lote', 'Drenaje observado del lote (bueno, regular, malo).', null, 'opcion', 'campo', '{}'::text[], 30),
  ('anegamiento_observado', 'Presencia de anegamiento observada en campo', 'Si hay sectores anegados en el lote.', null, 'booleano', 'campo', '{}'::text[], 7),
  ('saturacion_suelo', 'Humedad o saturación de suelo', 'Saturación observada del perfil.', null, 'opcion', 'campo', '{}'::text[], 7),
  ('tipo_suelo', 'Tipo de suelo o capacidad de almacenamiento de agua', 'Textura o serie de suelo del lote.', null, 'texto', 'campo', '{}'::text[], null),
  ('capacidad_agua_suelo', 'Tipo de suelo o capacidad de almacenamiento de agua', 'Agua útil del perfil.', 'mm', 'numero', 'campo', '{}'::text[], null),
  ('rastrojo', 'Rastrojo en superficie', 'Cobertura y cultivo del rastrojo presente.', null, 'texto', 'campo', '{}'::text[], 180),
  ('antecesor_rotacion', 'Antecesor y rotación', 'Cultivo antecesor y esquema de rotación del lote.', null, 'texto', 'campo', '{}'::text[], null),
  ('hospedantes_puentes_verdes', 'Cultivares, hospedantes o puentes verdes, cuando aplique', 'Hospedantes o puentes verdes cercanos al lote.', null, 'texto', 'campo', '{}'::text[], 30),
  ('monitoreo_presencia_densidad', 'Monitoreo de presencia y densidad', 'Conteo o densidad observada en el monitoreo.', null, 'numero', 'campo', '{}'::text[], 7),
  ('antecedentes_plagas_lote', 'Antecedentes de plagas en el lote', 'Plagas registradas en campañas anteriores.', null, 'texto', 'campo', '{}'::text[], null),
  ('fecha_ultima_lluvia_riego', 'Fecha de última lluvia o riego', 'Último evento de agua registrado en el lote.', null, 'fecha', 'campo', '{}'::text[], 30),
  ('duracion_exposicion_frio', 'Duración de la exposición a temperaturas bajas, cuando aplique', 'Horas bajo el umbral de daño medidas en el lote.', 'h', 'numero', 'campo', '{}'::text[], 3)
on conflict (clave) do nothing;

-- Lotes: registro mínimo para validar existencia y acceso. Un lote pertenece a una
-- empresa (acceso por su API key); sin empresa, sólo lo usan administración/servicio.
create table if not exists lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id),
  nombre text not null check (length(nombre) between 1 and 160),
  cultivo text,
  activo boolean not null default true,
  creado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lotes_empresa_idx on lotes (empresa_id) where activo = true;

create table if not exists datos_campo (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references lotes(id),
  variable_key text not null references variables_agronomicas(clave) on update cascade,
  value jsonb not null,
  unit text,
  observed_at timestamptz not null,
  valid_until timestamptz,
  status text not null default 'vigente' check (status in ('vigente', 'historico')),
  source text not null check (source in ('manual', 'sensor', 'import', 'calculated')),
  recorded_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until > observed_at)
);
create index if not exists datos_campo_lote_variable_idx
  on datos_campo (field_id, variable_key, observed_at desc);
create index if not exists datos_campo_vigentes_idx
  on datos_campo (field_id) where status = 'vigente';
