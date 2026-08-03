alter table consultas add column if not exists grupo_madurez text;
alter table consultas add column if not exists cultivar_id text;
alter table consultas add column if not exists estadio_estimado text;
alter table consultas add column if not exists fecha_inicio_estimada date;
alter table consultas add column if not exists fecha_fin_estimada date;
alter table consultas add column if not exists nivel_confianza_fenologia text;
alter table consultas add column if not exists modelo_fenologico_version text;

alter table consulta_logs add column if not exists grupo_madurez text;
alter table consulta_logs add column if not exists cultivar_id text;
alter table consulta_logs add column if not exists estadio_estimado text;
alter table consulta_logs add column if not exists fecha_inicio_estimada date;
alter table consulta_logs add column if not exists fecha_fin_estimada date;
alter table consulta_logs add column if not exists nivel_confianza_fenologia text;
alter table consulta_logs add column if not exists modelo_fenologico_version text;

alter table consultas drop constraint if exists consultas_grupo_madurez_check;
alter table consultas add constraint consultas_grupo_madurez_check
  check (grupo_madurez is null or grupo_madurez in ('III', 'IV corto', 'IV largo', 'V'));

alter table consulta_logs drop constraint if exists consulta_logs_grupo_madurez_check;
alter table consulta_logs add constraint consulta_logs_grupo_madurez_check
  check (grupo_madurez is null or grupo_madurez in ('III', 'IV corto', 'IV largo', 'V'));
