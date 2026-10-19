-- Roya amarilla: dos reglas configurables con la misma referencia técnica.
-- Open-Meteo solo puede producir vigilancia: no observa horas reales de mojado.
-- Los textos visibles no mencionan la falta de mojado: se pide como dato (required_data).

alter table reglas_agronomicas add column if not exists validation_status text;
alter table reglas_agronomicas add column if not exists evidence_level text;
alter table reglas_agronomicas add column if not exists source_name text;
alter table reglas_agronomicas add column if not exists source_url text;
alter table reglas_agronomicas add column if not exists reviewed_at timestamptz;
alter table reglas_agronomicas add column if not exists notes text;

alter table reglas_agronomicas drop constraint if exists reglas_agronomicas_validation_status_check;
alter table reglas_agronomicas add constraint reglas_agronomicas_validation_status_check
  check (validation_status is null or validation_status in ('validada', 'requiere_calibracion_local', 'requiere_validacion_agronoma'));
alter table reglas_agronomicas drop constraint if exists reglas_agronomicas_evidence_level_check;
alter table reglas_agronomicas add constraint reglas_agronomicas_evidence_level_check
  check (evidence_level is null or evidence_level in ('alta', 'media', 'limitada'));

with open_meteo as (
  select
    '{"niveles":[{"orden":1,"clave":"vigilancia","orden_visual":1,"etiqueta":"La temperatura es compatible con roya amarilla.","recomendacion":"Monitorear el lote durante los próximos 5 días.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[10,15],"unidad":"°C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb as definicion
)
update reglas_agronomicas r
set categoria_nombre = 'enfermedades_foliares', condicion = 'desfavorable',
    recomendacion = 'Monitorear el lote durante los próximos 5 días.',
    estado_regla = 'validada', estado = 'vigente', activa = true, ventana_dias = 1,
    definicion = open_meteo.definicion, condiciones_logicas = open_meteo.definicion,
    variables_requeridas = array['temperatura_media'],
    nombre_regla = 'Roya amarilla — vigilancia térmica (Open-Meteo)',
    zadoks_desde = null, zadoks_hasta = null, nivel_resultado = 'vigilancia',
    texto_alerta = 'La temperatura es compatible con roya amarilla.',
    texto_no_evaluable = 'Monitorear el lote mientras se completa la temperatura media del período.',
    accion_sugerida = 'Monitorear el lote durante los próximos 5 días.',
    requiere_validacion_agronomica = false,
    fuente_tecnica = 'Referencia técnica de roya amarilla configurada para AVIZOR.',
    limitaciones_declaradas = 'Open-Meteo no observa horas reales de mojado foliar. Esta regla es solo de vigilancia térmica y no confirma enfermedad.',
    nivel_evidencia = 'validada', updated_at = now()
    , validation_status = 'requiere_calibracion_local', evidence_level = 'alta',
    source_name = 'SINAVIMO', source_url = 'https://www.sinavimo.gob.ar/plaga/puccinia-striiformis',
    reviewed_at = now(), notes = 'Open-Meteo aporta temperatura y probabilidad de mojado, pero no horas efectivas de mojado foliar. Esta regla es exclusivamente de vigilancia.'
from open_meteo
where r.cultivo = 'trigo' and r.clave = 'roya_amarilla' and r.version = '1.0';

insert into reglas_agronomicas (
  cultivo, categoria_nombre, condicion, causas, recomendacion, regla_version,
  estado_regla, prioridad, activa, combinador, condiciones, clave, version,
  estado, ventana_dias, fuente_tecnica, limitaciones_declaradas,
  condiciones_revision, decisiones_pendientes, definicion,
  nombre_regla, variables_requeridas, condiciones_logicas, zadoks_desde,
  zadoks_hasta, nivel_resultado, texto_alerta, texto_no_evaluable,
  accion_sugerida, requiere_validacion_agronomica, nivel_evidencia,
  validation_status, evidence_level, source_name, source_url, reviewed_at, notes
) values (
  'trigo', 'enfermedades_foliares', 'desfavorable', '{}',
  'Monitorear el lote durante los próximos 5 días.', '1.0',
  'validada', 10, true, 'all', '[]', 'roya_amarilla_mojado_foliar', '1.0',
  'vigente', 1, 'Referencia técnica de roya amarilla configurada para AVIZOR.',
  'Requiere horas de mojado foliar de sensor o modelo calibrado; Open-Meteo no las sustituye.',
  'Revisar cuando se incorpore una fuente calibrada de mojado foliar.', '{}',
  '{"niveles":[{"orden":1,"clave":"favorable","orden_visual":1,"etiqueta":"Condiciones favorables para monitoreo de roya amarilla","recomendacion":"Monitorear el lote durante los próximos 5 días.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[10,15],"unidad":"°C"},{"variable":"leaf_wetness_hours","agregador":"media_ventana","operador":"gte","valor":6,"unidad":"h"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,
  'Roya amarilla — mojado foliar medido', array['temperatura_media', 'leaf_wetness_hours'],
  '{"niveles":[{"orden":1,"clave":"favorable","orden_visual":1,"etiqueta":"Condiciones favorables para monitoreo de roya amarilla","recomendacion":"Monitorear el lote durante los próximos 5 días.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[10,15],"unidad":"°C"},{"variable":"leaf_wetness_hours","agregador":"media_ventana","operador":"gte","valor":6,"unidad":"h"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,
  null, null, 'riesgo_alto', 'Condiciones completas de temperatura y mojado foliar para monitoreo de roya amarilla.',
  'La evaluación completa de roya amarilla se apoya en horas de mojado foliar medidas o calculadas por un modelo calibrado.',
  'Monitorear el lote durante los próximos 5 días.', false, 'alta',
  'validada', 'alta', 'SINAVIMO', 'https://www.sinavimo.gob.ar/plaga/puccinia-striiformis', now(),
  'Requiere horas de mojado foliar reales o de un modelo calibrado.'
)
on conflict (cultivo, clave, version) where clave is not null do update set
  definicion = excluded.definicion, condiciones_logicas = excluded.condiciones_logicas,
  variables_requeridas = excluded.variables_requeridas, estado = excluded.estado,
  estado_regla = excluded.estado_regla, activa = excluded.activa,
  nombre_regla = excluded.nombre_regla, zadoks_desde = excluded.zadoks_desde,
  zadoks_hasta = excluded.zadoks_hasta, nivel_resultado = excluded.nivel_resultado,
  texto_alerta = excluded.texto_alerta, texto_no_evaluable = excluded.texto_no_evaluable,
  accion_sugerida = excluded.accion_sugerida, limitaciones_declaradas = excluded.limitaciones_declaradas,
  validation_status = excluded.validation_status, evidence_level = excluded.evidence_level,
  source_name = excluded.source_name, source_url = excluded.source_url,
  reviewed_at = excluded.reviewed_at, notes = excluded.notes,
  updated_at = now();
