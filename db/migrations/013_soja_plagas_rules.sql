-- Módulo de reglas de plagas de soja v1.0. Complementa el catálogo creado por 012_plagas.sql.
-- No activa reglas con parámetros agronómicos pendientes y no modifica el score existente.

create table if not exists fuentes_agronomicas (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nivel text not null check (nivel in ('A','B','C','D')),
  institucion text not null,
  referencia text not null,
  url text,
  fecha_fuente date,
  created_at timestamptz not null default now()
);

create table if not exists reglas_plagas (
  id uuid primary key default gen_random_uuid(),
  id_logico text not null,
  version text not null,
  cultivo text not null,
  grupo_plaga text not null,
  especies text[] not null,
  tipo_regla text not null check (tipo_regla in ('climatica','prioridad_monitoreo')),
  estado text not null check (estado in ('experimental','revisada','vigente','retirada')),
  activa boolean not null default false,
  nivel_evidencia_climatica text not null check (nivel_evidencia_climatica in ('alto','medio','bajo','muy_bajo')),
  variables_requeridas text[] not null default '{}',
  fenologia_desde text,
  fenologia_hasta text,
  configuracion jsonb not null,
  textos jsonb not null,
  fuente_tecnica text not null,
  validado_por text,
  fecha_validacion date,
  vigencia_desde date,
  vigencia_hasta date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cultivo,id_logico,version),
  check (jsonb_typeof(configuracion)='object'),
  check (jsonb_typeof(textos)='object'),
  check (not activa or estado in ('experimental','vigente'))
);

create table if not exists reglas_plagas_fuentes (
  regla_id uuid not null references reglas_plagas(id),
  fuente_id uuid not null references fuentes_agronomicas(id),
  primary key (regla_id,fuente_id)
);

create index if not exists reglas_plagas_cultivo_activa_idx on reglas_plagas(cultivo,activa,estado);
alter table consultas add column if not exists plagas_json jsonb;

insert into fuentes_agronomicas(clave,nivel,institucion,referencia,url) values
('inta_flores_trips_2021','A','INTA EEA Marcos Juárez / IDIA21','Flores, F. (2021). Manejo de trips Caliothrips phaseoli en soja.','https://repositorio.inta.gob.ar/handle/20.500.12123/11031'),
('inta_sistema_alarma','A','INTA EEA Marcos Juárez','Sistema de Alarma de Plagas, Balbi & Flores.',null),
('eeaoc_plagas_soja','A','EEAOC','Plagas de la soja / orugas defoliadoras, Avance Agroindustrial.',null),
('aapresid_monitoreo_soja','B','Aapresid / REM','Criterios para el monitoreo y control de plagas en soja.',null)
on conflict(clave) do update set nivel=excluded.nivel,institucion=excluded.institucion,referencia=excluded.referencia,url=excluded.url;

insert into zonas_agronomicas(clave,nombre,definicion_geografica) values
('noa','NOA',null),('nea','NEA',null),('litoral','Litoral',null),('zona_nucleo','Zona Núcleo',null),
('centro','Centro',null),('pampeana_sur','Pampeana Sur',null),('buenos_aires_sudeste','Sudeste de Buenos Aires',null)
on conflict(clave) do update set nombre=excluded.nombre;

insert into reglas_plagas(id_logico,version,cultivo,grupo_plaga,especies,tipo_regla,estado,activa,nivel_evidencia_climatica,variables_requeridas,fenologia_desde,fenologia_hasta,configuracion,textos,fuente_tecnica) values
('P-01','1.0','soja','trips',array['caliothrips_phaseoli'],'climatica','experimental',true,'alto',array['temp_media_7d','precip_7d','dias_con_lluvia_7d'],null,null,
 '{"umbral_dia_lluvia_mm":1,"niveles":[{"orden":1,"estado":"favorabilidad_alta","combinador":"all","condiciones":[{"indicador":"temp_media_7d","operador":"gte","valor":25},{"indicador":"precip_7d","operador":"lt","valor":10},{"indicador":"dias_con_lluvia_7d","operador":"lte","valor":1}]},{"orden":2,"estado":"favorabilidad_moderada","combinador":"all","condiciones":[{"indicador":"temp_media_7d","operador":"gte","valor":20},{"indicador":"precip_7d","operador":"lt","valor":25}]},{"orden":3,"estado":"sin_condiciones_destacadas","combinador":"any","condiciones":[{"indicador":"precip_7d","operador":"gte","valor":25},{"indicador":"dias_con_lluvia_7d","operador":"gte","valor":3}]}]}'::jsonb,
 '{"por_que_se_muestra":"El cultivo, la zona y el clima reciente permiten contextualizar el monitoreo.","estado":"Favorabilidad ambiental para trips","que_significa":"El clima reciente coincide con condiciones asociadas al desarrollo de trips. Esto no indica presencia.","que_observar":"Revisar folíolos, especialmente en sectores representativos del lote.","seguimiento":"Complementar la señal con monitoreo a campo y el criterio del asesor.","evidencia_tecnica":"Regla P-01 experimental; sus umbrales son una propuesta Avizor pendiente de validación profesional."}'::jsonb,
 'Flores (2021), INTA; Sistema de Alarma INTA Marcos Juárez.'),
('P-02','1.0','soja','aranuela',array['tetranychus_urticae'],'climatica','experimental',false,'alto',array['temp_media_10d','temp_max_media_10d','dias_calidos_10d','precip_10d','precip_7d','dias_consecutivos_sin_lluvia','dias_con_lluvia_7d'],null,null,
 '{"umbral_dia_lluvia_mm":1,"tipo_agregacion_termica":null,"umbral_termico":null,"cantidad_dias_minima":null,"niveles":[]}'::jsonb,
 '{"por_que_se_muestra":"La zona y el clima reciente permiten contextualizar el monitoreo.","estado":"Favorabilidad ambiental para arañuela","que_significa":"El clima puede aportar contexto, pero esta regla aún no tiene criterio térmico validado.","que_observar":"Envés de hojas del estrato inferior y bordes del lote; telilla, punteado clorótico y colonias.","seguimiento":"Complementar con monitoreo a campo y el criterio del asesor.","evidencia_tecnica":"P-02 inactiva hasta resolver PEND-19."}'::jsonb,
 'INTA Marcos Juárez; Aapresid/REM; EEAOC.'),
('P-03','1.0','soja','orugas_defoliadoras',array['rachiplusia_nu','anticarsia_gemmatalis','chrysodeixis_includens'],'prioridad_monitoreo','experimental',false,'medio',array[]::text[],null,null,
 '{"umbral_dia_lluvia_mm":1}'::jsonb,
 '{"por_que_se_muestra":"La zona y la etapa del cultivo definen la pertinencia del monitoreo.","estado":"Período relevante para monitoreo de orugas defoliadoras","que_significa":"Esta señal prioriza la observación; no predice presencia ni abundancia.","que_observar":"Daño de defoliación y larvas mediante monitoreo representativo.","seguimiento":"Observar el lote y complementar con el asesor.","evidencia_tecnica":"P-03 pendiente de rango fenológico validado."}'::jsonb,
 'INTA Pergamino; INTA Las Breñas; INTA Marcos Juárez.'),
('P-04','1.0','soja','bolillera_spodoptera',array['helicoverpa_gelotopoeon','spodoptera_cosmioides','spodoptera_frugiperda'],'prioridad_monitoreo','experimental',false,'bajo',array[]::text[],null,null,
 '{"umbral_dia_lluvia_mm":1}'::jsonb,
 '{"por_que_se_muestra":"La zona y la etapa del cultivo definen la pertinencia del monitoreo.","estado":"Período relevante para monitoreo de bolillera y Spodoptera","que_significa":"Esta señal prioriza la observación; no predice presencia ni abundancia.","que_observar":"Larvas y daños en estructuras vegetativas y reproductivas.","seguimiento":"Observar el lote y complementar con el asesor.","evidencia_tecnica":"P-04 pendiente de rango fenológico validado."}'::jsonb,
 'INTA Pergamino.'),
('P-05','1.0','soja','chinches',array['nezara_viridula','piezodorus_guildinii','dichelops_furcatus','edessa_meditabunda','euschistus_heros'],'prioridad_monitoreo','experimental',false,'muy_bajo',array[]::text[],'R3','R6',
 '{"umbral_dia_lluvia_mm":1}'::jsonb,
 '{"por_que_se_muestra":"La zona y la etapa reproductiva estimada definen la pertinencia del monitoreo.","estado":"Período relevante para monitoreo de chinches","que_significa":"Esta señal prioriza la observación; no predice presencia ni abundancia.","que_observar":"Realizar monitoreo representativo e identificar las especies observadas.","seguimiento":"Observar el lote y complementar con el asesor.","evidencia_tecnica":"P-05 y el rango R3–R6 están pendientes de validación profesional."}'::jsonb,
 'Aapresid/REM; INTA.')
on conflict(cultivo,id_logico,version) do update set estado=excluded.estado,activa=excluded.activa,nivel_evidencia_climatica=excluded.nivel_evidencia_climatica,variables_requeridas=excluded.variables_requeridas,fenologia_desde=excluded.fenologia_desde,fenologia_hasta=excluded.fenologia_hasta,configuracion=excluded.configuracion,textos=excluded.textos,fuente_tecnica=excluded.fuente_tecnica,updated_at=now();

insert into reglas_plagas_fuentes(regla_id,fuente_id)
select r.id,f.id from reglas_plagas r join fuentes_agronomicas f on
 (r.id_logico in ('P-01','P-02','P-03','P-04') and f.clave='inta_sistema_alarma') or
 (r.id_logico in ('P-02','P-05') and f.clave='aapresid_monitoreo_soja') or
 (r.id_logico='P-03' and f.clave='eeaoc_plagas_soja') or
 (r.id_logico='P-01' and f.clave='inta_flores_trips_2021')
where r.cultivo='soja' and r.version='1.0'
on conflict do nothing;

with catalogo(grupo,especie,nombre,nombre_cientifico,tipo_regla) as (values
('trips','caliothrips_phaseoli','Trips','Caliothrips phaseoli','climatica'),
('aranuela','tetranychus_urticae','Arañuela','Tetranychus urticae','climatica'),
('orugas_defoliadoras','rachiplusia_nu','Oruga medidora','Rachiplusia nu','prioridad_monitoreo'),
('orugas_defoliadoras','anticarsia_gemmatalis','Oruga de las leguminosas','Anticarsia gemmatalis','prioridad_monitoreo'),
('orugas_defoliadoras','chrysodeixis_includens','Falsa medidora','Chrysodeixis includens','prioridad_monitoreo'),
('bolillera_spodoptera','spodoptera_cosmioides','Spodoptera cosmioides','Spodoptera cosmioides','prioridad_monitoreo'),
('bolillera_spodoptera','spodoptera_frugiperda','Cogollero','Spodoptera frugiperda','prioridad_monitoreo'),
('bolillera_spodoptera','helicoverpa_gelotopoeon','Bolillera','Helicoverpa gelotopoeon','prioridad_monitoreo'),
('picudo_negro','rhyssomatus_subtilis','Picudo negro','Rhyssomatus subtilis','prioridad_monitoreo'),
('chinches','complejo','Complejo de chinches',null,'prioridad_monitoreo'))
insert into catalogo_plagas(cultivo,grupo_plaga,especie,nombre,nombre_cientifico,tipo_regla,estado_catalogo,version)
select 'soja',grupo,especie,nombre,nombre_cientifico,tipo_regla,'catalogada','1.0' from catalogo
on conflict (cultivo,grupo_plaga,(coalesce(especie,'')),version) do update
set nombre=excluded.nombre,nombre_cientifico=excluded.nombre_cientifico,tipo_regla=excluded.tipo_regla,updated_at=now();

with regionales(grupo,especie,prioridades,fuente_clave) as (values
('trips','caliothrips_phaseoli',array['variable','variable','variable','principal','principal','variable','variable'],'inta_flores_trips_2021'),
('aranuela','tetranychus_urticae',array['variable','variable','variable','principal','principal','variable','variable'],'inta_sistema_alarma'),
('orugas_defoliadoras','rachiplusia_nu',array['principal','principal','principal','principal','principal','variable','variable'],'eeaoc_plagas_soja'),
('orugas_defoliadoras','anticarsia_gemmatalis',array['principal','principal','principal','principal','principal','variable','variable'],'eeaoc_plagas_soja'),
('orugas_defoliadoras','chrysodeixis_includens',array['principal','principal','variable','variable','variable','sin_evidencia_suficiente','sin_evidencia_suficiente'],'eeaoc_plagas_soja'),
('bolillera_spodoptera','spodoptera_cosmioides',array['principal','principal','variable','variable','variable','variable','variable'],'eeaoc_plagas_soja'),
('bolillera_spodoptera','spodoptera_frugiperda',array['principal','principal','variable','variable','variable','variable','variable'],'eeaoc_plagas_soja'),
('bolillera_spodoptera','helicoverpa_gelotopoeon',array['principal','principal','principal','principal','principal','variable','variable'],'eeaoc_plagas_soja'),
('picudo_negro','rhyssomatus_subtilis',array['principal','variable','sin_evidencia_suficiente','sin_evidencia_suficiente','sin_evidencia_suficiente','sin_evidencia_suficiente','sin_evidencia_suficiente'],'eeaoc_plagas_soja'),
('chinches','complejo',array['principal','principal','principal','principal','principal','variable','variable'],'aapresid_monitoreo_soja')
), zonas as (select * from (values ('noa',1),('nea',2),('litoral',3),('zona_nucleo',4),('centro',5),('pampeana_sur',6),('buenos_aires_sudeste',7)) v(clave,orden))
insert into plagas_regionales(plaga_id,zona_id,prioridad,fuente_id,estado,observaciones)
select cp.id,z.id,r.prioridades[zs.orden],f.id::text,'revisada',
 'Catálogo v0.4 pendiente de validación; sin meses regionales ni geografía exacta definidos.'
from regionales r join catalogo_plagas cp on cp.cultivo='soja' and cp.grupo_plaga=r.grupo and cp.especie=r.especie
join fuentes_agronomicas f on f.clave=r.fuente_clave cross join zonas zs join zonas_agronomicas z on z.clave=zs.clave
where r.prioridades[zs.orden] in ('principal','variable')
and not exists(select 1 from plagas_regionales pr where pr.plaga_id=cp.id and pr.zona_id=z.id);

insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id)
select 'migration-013','service','crear_version','regla_plaga',r.id::text,null,
 jsonb_build_object('id_logico',r.id_logico,'version',r.version,'estado',r.estado,'activa',r.activa),gen_random_uuid()
from reglas_plagas r where r.version='1.0'
and not exists(select 1 from auditoria a where a.actor_id='migration-013' and a.accion='crear_version' and a.entidad_id=r.id::text);

insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id)
select 'migration-013','service','crear_version','plaga_regional',pr.id::text,null,
 jsonb_build_object('grupo_plaga',cp.grupo_plaga,'especie',cp.especie,'zona_id',pr.zona_id,'prioridad',pr.prioridad,'version',cp.version),gen_random_uuid()
from plagas_regionales pr join catalogo_plagas cp on cp.id=pr.plaga_id where cp.cultivo='soja' and cp.version='1.0'
and not exists(select 1 from auditoria a where a.actor_id='migration-013' and a.accion='crear_version' and a.entidad_id=pr.id::text);
