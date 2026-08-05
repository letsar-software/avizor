alter table reglas_agronomicas add column if not exists clave text;
alter table reglas_agronomicas add column if not exists version text;
alter table reglas_agronomicas add column if not exists estado text;
alter table reglas_agronomicas add column if not exists ventana_dias integer;
alter table reglas_agronomicas add column if not exists fuente_tecnica text;
alter table reglas_agronomicas add column if not exists limitaciones_declaradas text;
alter table reglas_agronomicas add column if not exists validado_por text;
alter table reglas_agronomicas add column if not exists validado_en timestamptz;
alter table reglas_agronomicas add column if not exists condiciones_revision text;
alter table reglas_agronomicas add column if not exists decisiones_pendientes text[] not null default '{}';
alter table reglas_agronomicas add column if not exists definicion jsonb;

alter table reglas_agronomicas drop constraint if exists reglas_agronomicas_estado_check;
alter table reglas_agronomicas add constraint reglas_agronomicas_estado_check check (estado is null or estado in ('experimental','revisada','vigente','retirada'));
create unique index if not exists reglas_agronomicas_clave_version_idx on reglas_agronomicas (cultivo, clave, version) where clave is not null;
update reglas_agronomicas set estado = 'retirada', activa = false where clave is null;

insert into reglas_agronomicas (
  cultivo, categoria_nombre, condicion, causas, recomendacion, regla_version, estado_regla, prioridad, activa, combinador, condiciones,
  clave, version, estado, ventana_dias, fuente_tecnica, limitaciones_declaradas, validado_por, validado_en, condiciones_revision, decisiones_pendientes, definicion
) values
('soja','enfermedades_foliares','moderada','{}','Monitorear el lote durante los próximos 5 días.','1.0','validada',400,true,'all','[]',
 'enfermedades_foliares','1.0','vigente',5,
 'Carmona et al. (2015), Agronomía & Ambiente 35(1):37-52.',
 'Identifica coincidencias ambientales; no diagnostica presencia, severidad ni rendimiento.','Natali Lazzaro','2026-07-31T00:00:00Z','Nueva evidencia técnica o revisión de umbrales y etiquetas.','{}',
 '{"niveles":[
   {"orden":1,"clave":"favorables","orden_visual":1,"etiqueta":"Condiciones favorables para enfermedades foliares","recomendacion":"Monitorear el lote durante los próximos 5 días.","condiciones":[{"variable":"humedad_relativa","agregador":"media_ventana","operador":"gt","valor":80,"unidad":"%"},{"variable":"precipitacion","agregador":"dias_con_condicion","subcondicion":{"operador":"gte","valor":1,"unidad":"mm"},"operador":"gte","valor":3,"unidad":"dias"},{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[18,28],"unidad":"C"}]},
   {"orden":2,"clave":"moderadas","orden_visual":2,"etiqueta":"Condiciones moderadas para enfermedades foliares","recomendacion":"Continuar el seguimiento del lote.","condiciones":[{"variable":"humedad_relativa","agregador":"media_ventana","operador":"between","valor":[65,80],"unidad":"%"},{"variable":"precipitacion","agregador":"dias_con_condicion","subcondicion":{"operador":"gte","valor":1,"unidad":"mm"},"operador":"between","valor":[1,2],"unidad":"dias"},{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[18,28],"unidad":"C","provisorio":true}]},
   {"orden":3,"clave":"desfavorables","orden_visual":3,"etiqueta":"Condiciones desfavorables para enfermedades foliares","recomendacion":"Mantener el monitoreo habitual.","condiciones":[{"variable":"humedad_relativa","agregador":"media_ventana","operador":"lt","valor":65,"unidad":"%"},{"variable":"precipitacion","agregador":"dias_con_condicion","subcondicion":{"operador":"gte","valor":1,"unidad":"mm"},"operador":"eq","valor":0,"unidad":"dias"}]}
 ],"sin_coincidencia":{"estado":"indeterminado","motivo":"sin_nivel_coincidente"}}'),
('soja','temperatura_bajo_umbral','favorable','{}','Revisar el pronóstico y observar sectores bajos.','1.0','validada',300,true,'all','[]',
 'temperatura_bajo_umbral','1.0','vigente',3,'Fernández Long et al. (2005), caracterización de heladas en la región pampeana.','No confirma daño ni reemplaza la observación del cultivo.','Natali Lazzaro','2026-07-31T00:00:00Z','Nueva evidencia regional o revisión del umbral.','{}',
 '{"niveles":[{"orden":1,"clave":"condiciones_detectadas","orden_visual":1,"etiqueta":"Temperaturas mínimas bajo el umbral","condiciones":[{"variable":"temperatura_min","agregador":"min_ventana","operador":"lt","valor":2,"unidad":"C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'),
('soja','baja_precipitacion','favorable','{}','Revisar disponibilidad de agua y evolución del lote.','1.0','validada',200,true,'all','[]',
 'baja_precipitacion','1.0','vigente',14,'Allen et al. (1998), FAO Irrigation and Drainage Paper 56.','No estima agua útil del suelo ni diagnostica estrés del cultivo.','Natali Lazzaro','2026-07-31T00:00:00Z','Nueva evidencia o incorporación validada de balance hídrico.','{}',
 '{"niveles":[{"orden":1,"clave":"condiciones_detectadas","orden_visual":1,"etiqueta":"Precipitación acumulada baja","condiciones":[{"variable":"precipitacion","agregador":"suma_ventana","operador":"lt","valor":10,"unidad":"mm"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'),
('soja','precipitacion_elevada','favorable','{}','Observar sectores bajos y posibles anegamientos.','1.0','validada',100,true,'all','[]',
 'precipitacion_elevada','1.0','vigente',7,'Allen et al. (1998), FAO Irrigation and Drainage Paper 56.','No estima infiltración, drenaje ni anegamiento efectivo.','Natali Lazzaro','2026-07-31T00:00:00Z','Nueva evidencia o incorporación de suelo y drenaje.','{}',
 '{"niveles":[{"orden":1,"clave":"condiciones_detectadas","orden_visual":1,"etiqueta":"Precipitación acumulada elevada","condiciones":[{"variable":"precipitacion","agregador":"suma_ventana","operador":"gt","valor":100,"unidad":"mm"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}')
on conflict (cultivo, clave, version) where clave is not null do update set estado=excluded.estado, activa=true, definicion=excluded.definicion,
 fuente_tecnica=excluded.fuente_tecnica, limitaciones_declaradas=excluded.limitaciones_declaradas, validado_por=excluded.validado_por,
 validado_en=excluded.validado_en, condiciones_revision=excluded.condiciones_revision, decisiones_pendientes=excluded.decisiones_pendientes;

alter table consultas add column if not exists localidad_original text;
alter table consultas add column if not exists latitud double precision;
alter table consultas add column if not exists longitud double precision;
alter table consultas add column if not exists fecha_ref date;
alter table consultas add column if not exists canal text;
alter table consultas add column if not exists entrada_json jsonb;
alter table consultas add column if not exists clima_json jsonb;
alter table consultas add column if not exists indicadores_json jsonb;
alter table consultas add column if not exists resultados_json jsonb;
alter table consultas add column if not exists contexto_fenologico_json jsonb;
alter table consultas add column if not exists proveedor_climatico text;
alter table consultas add column if not exists duracion_ms integer;
alter table consultas add column if not exists request_id uuid;

create table if not exists api_keys (
 id uuid primary key default gen_random_uuid(), nombre text not null, key_hash text not null unique, activa boolean not null default true,
 revocada_at timestamptz, expira_at timestamptz, limite_mensual integer, created_at timestamptz not null default now()
);
create table if not exists api_uso (
 id uuid primary key default gen_random_uuid(), api_key_id uuid not null references api_keys(id), request_id uuid not null,
 endpoint text not null, status integer not null, duracion_ms integer not null, created_at timestamptz not null default now()
);
create table if not exists auditoria (
 id uuid primary key default gen_random_uuid(), actor_id text not null, actor_tipo text not null, accion text not null,
 entidad text not null, entidad_id text, valor_anterior jsonb, valor_nuevo jsonb, request_id uuid not null, created_at timestamptz not null default now()
);

create table if not exists cultivos (
 id uuid primary key default gen_random_uuid(), clave text not null unique, nombre text not null, activo boolean not null default true,
 feature_flag text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into cultivos(clave,nombre,activo) values('soja','Soja',true) on conflict(clave) do nothing;
