-- Configuración genérica de reglas agronómicas.
-- Esta migración conserva las columnas heredadas para compatibilidad y agrega
-- los campos que consume el administrador. No activa ni altera umbrales.

create table if not exists categorias_agronomicas (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subcategorias_agronomicas (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias_agronomicas(id),
  clave text not null,
  nombre text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (categoria_id, clave)
);

create table if not exists etapas_fenologicas (
  id uuid primary key default gen_random_uuid(),
  cultivo_id uuid not null references cultivos(id),
  clave text not null,
  nombre text not null,
  zadoks_desde integer,
  zadoks_hasta integer,
  descripcion text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cultivo_id, clave),
  check (zadoks_desde is null or zadoks_hasta is null or zadoks_desde <= zadoks_hasta)
);

alter table reglas_agronomicas add column if not exists cultivo_id uuid references cultivos(id);
alter table reglas_agronomicas add column if not exists categoria_id uuid references categorias_agronomicas(id);
alter table reglas_agronomicas add column if not exists subcategoria_id uuid references subcategorias_agronomicas(id);
alter table reglas_agronomicas add column if not exists nombre_regla text;
alter table reglas_agronomicas add column if not exists etapa_fenologica_desde text;
alter table reglas_agronomicas add column if not exists etapa_fenologica_hasta text;
alter table reglas_agronomicas add column if not exists zadoks_desde integer;
alter table reglas_agronomicas add column if not exists zadoks_hasta integer;
alter table reglas_agronomicas add column if not exists variables_requeridas text[] not null default '{}';
alter table reglas_agronomicas add column if not exists condiciones_logicas jsonb;
alter table reglas_agronomicas add column if not exists ventana_temporal jsonb;
alter table reglas_agronomicas add column if not exists nivel_resultado text;
alter table reglas_agronomicas add column if not exists texto_alerta text;
alter table reglas_agronomicas add column if not exists texto_no_evaluable text;
alter table reglas_agronomicas add column if not exists accion_sugerida text;
alter table reglas_agronomicas add column if not exists requiere_validacion_agronomica boolean not null default true;
alter table reglas_agronomicas add column if not exists fuente text;
alter table reglas_agronomicas add column if not exists url_fuente text;
alter table reglas_agronomicas add column if not exists nivel_evidencia text;
alter table reglas_agronomicas add column if not exists vigencia_desde date;
alter table reglas_agronomicas add column if not exists vigencia_hasta date;

alter table reglas_agronomicas drop constraint if exists reglas_agronomicas_nivel_resultado_check;
alter table reglas_agronomicas add constraint reglas_agronomicas_nivel_resultado_check
  check (nivel_resultado is null or nivel_resultado in (
    'no_evaluable', 'sin_condiciones', 'vigilancia',
    'riesgo_moderado', 'riesgo_alto', 'riesgo_critico'
  ));

insert into categorias_agronomicas (clave, nombre) values
  ('enfermedades_foliares', 'Patógenos'),
  ('plagas', 'Plagas'),
  ('heladas', 'Heladas'),
  ('estres_hidrico', 'Estrés hídrico'),
  ('exceso_hidrico', 'Exceso hídrico')
on conflict (clave) do update set nombre = excluded.nombre, updated_at = now();

-- Identidad relacional para reglas existentes: el motor continúa leyendo la
-- versión y definición originales, ahora también disponibles en formato
-- administrable. No se cambian estado, prioridad, ventana ni definición.
update reglas_agronomicas r
set cultivo_id = c.id,
    categoria_id = (
      select id from categorias_agronomicas where clave = r.categoria_nombre
    ),
    nombre_regla = coalesce(r.nombre_regla, r.clave),
    condiciones_logicas = coalesce(r.condiciones_logicas, r.definicion),
    ventana_temporal = coalesce(r.ventana_temporal, jsonb_build_object('dias', r.ventana_dias)),
    fuente = coalesce(r.fuente, r.fuente_tecnica)
from cultivos c
where c.clave = r.cultivo;

create index if not exists reglas_agronomicas_configuracion_activa_idx
  on reglas_agronomicas (cultivo_id, categoria_id, activa, prioridad desc);
create index if not exists reglas_agronomicas_vigencia_idx
  on reglas_agronomicas (vigencia_desde, vigencia_hasta)
  where vigencia_desde is not null or vigencia_hasta is not null;

-- Etapas configurables de trigo. La carga es descriptiva y no modifica reglas.
insert into etapas_fenologicas (cultivo_id, clave, nombre, zadoks_desde, zadoks_hasta) values
  ((select id from cultivos where clave = 'trigo'), 'emergencia', 'Emergencia', 10, 19),
  ((select id from cultivos where clave = 'trigo'), 'macollaje', 'Macollaje', 20, 29),
  ((select id from cultivos where clave = 'trigo'), 'encanazon', 'Encañazón', 30, 49),
  ((select id from cultivos where clave = 'trigo'), 'espigazon', 'Espigazón', 50, 59),
  ((select id from cultivos where clave = 'trigo'), 'floracion', 'Floración / antesis', 60, 69),
  ((select id from cultivos where clave = 'trigo'), 'llenado', 'Llenado de grano', 70, 79),
  ((select id from cultivos where clave = 'trigo'), 'madurez', 'Madurez', 80, 99)
on conflict (cultivo_id, clave) do update set
  nombre = excluded.nombre,
  zadoks_desde = excluded.zadoks_desde,
  zadoks_hasta = excluded.zadoks_hasta,
  updated_at = now();

-- Datos de suelo, anegamiento y duración horaria se mantienen como variables
-- configurables para planes con instrumentación. No se agregan como requisito
-- de ninguna regla vigente del MVP: si una regla futura los exige, el motor
-- responderá "no evaluable" hasta que el dato exista.
