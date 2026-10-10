-- Trigo se incorpora sin modificar ninguna fila de soja. Los umbrales de
-- Natali no están disponibles en el repositorio: por eso estas fichas quedan
-- explícitamente NO_EVALUABLES y no generan señales climáticas.

insert into cultivos (clave, nombre, activo, feature_flag)
values ('trigo', 'Trigo', true, 'ENABLE_TRIGO')
on conflict (clave) do update set nombre = excluded.nombre, activo = true, feature_flag = excluded.feature_flag, updated_at = now();

with enfermedades(clave,nombre,nombre_cientifico,organo,fenologia) as (values
  ('roya_amarilla','Roya amarilla','Puccinia striiformis f. sp. tritici','hojas','Macollaje a llenado de grano'),
  ('roya_hoja','Roya de la hoja','Puccinia triticina','hojas','Encañazón a llenado de grano'),
  ('mancha_amarilla','Mancha amarilla','Pyrenophora tritici-repentis','hojas','Macollaje a llenado de grano'),
  ('roya_tallo','Roya del tallo','Puccinia graminis f. sp. tritici','tallos y hojas','Encañazón a llenado de grano'),
  ('fusariosis_espiga','Fusariosis de la espiga','Fusarium graminearum species complex','espigas','Floración'),
  ('septoriosis','Septoriosis','Zymoseptoria tritici','hojas','Macollaje a llenado de grano')
)
insert into catalogo_enfermedades
  (cultivo,clave,categoria,nombre,nombre_cientifico,organo_afectado,evaluabilidad,modo_avizor,estado_catalogo,condiciones_normalizadas,factores_no_observables,cobertura_esperada,fuentes,version)
select 'trigo',clave,'foliar',nombre,nombre_cientifico,organo,'PENDIENTE_EVIDENCIA','EXPERIMENTAL','catalogada',
  jsonb_build_object('fenologia_relevante',fenologia,'estado','pendiente_de_umbral_validado_por_natali'),
  array['umbral_ambiental_validado','mojado_foliar','inoculo','observacion_lote'],'INSUFICIENTE',
  jsonb_build_array(jsonb_build_object('referencia','Pendiente de carga: documentación agronómica y aprobación de Natali.')),'1.0'
from enfermedades
on conflict (cultivo,clave,version) do update set nombre=excluded.nombre, nombre_cientifico=excluded.nombre_cientifico,
  organo_afectado=excluded.organo_afectado, evaluabilidad=excluded.evaluabilidad, modo_avizor=excluded.modo_avizor,
  estado_catalogo=excluded.estado_catalogo, condiciones_normalizadas=excluded.condiciones_normalizadas,
  factores_no_observables=excluded.factores_no_observables, cobertura_esperada=excluded.cobertura_esperada,
  fuentes=excluded.fuentes, updated_at=now();

insert into reglas_agronomicas
  (cultivo,categoria_nombre,condicion,causas,recomendacion,regla_version,estado_regla,prioridad,activa,combinador,condiciones,clave,version,estado,ventana_dias,fuente_tecnica,limitaciones_declaradas,validado_por,condiciones_revision,decisiones_pendientes,definicion)
select 'trigo','foliar','desfavorable','{}','Mantener el monitoreo habitual; esta enfermedad aún no tiene umbrales climáticos validados cargados en Avizor.','1.0','pendiente',0,true,'all','[]',
  clave,'1.0','experimental',14,'Pendiente de incorporación: documentación agronómica aprobada por Natali.',
  'Evaluación incompleta: faltan umbrales aprobados, horas de mojado foliar e información de inóculo/observación a campo.',null,
  'Cargar umbrales aprobados por Natali y revisar variables disponibles.',array['No genera señal ni modifica el score hasta contar con validación.'],
  '{"niveles":[],"sin_coincidencia":{"estado":"no_evaluable","motivo":"configuracion_incompleta"}}'::jsonb
from catalogo_enfermedades where cultivo='trigo' and version='1.0'
on conflict (cultivo,clave,version) where clave is not null do update set activa=true, estado='experimental', estado_regla='pendiente',
  fuente_tecnica=excluded.fuente_tecnica, limitaciones_declaradas=excluded.limitaciones_declaradas,
  condiciones_revision=excluded.condiciones_revision, decisiones_pendientes=excluded.decisiones_pendientes,
  definicion=excluded.definicion, updated_at=now();
