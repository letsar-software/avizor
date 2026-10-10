-- Reglas preliminares para la validación con Natali. Son aditivas, no alteran
-- soja y no producen señales: PENDIENTE_EVIDENCIA es tratado por RulesEngineV2
-- como no_evaluable hasta recibir validación agronómica explícita.

with reglas(clave,categoria,nombre,ventana,condiciones,limitaciones,fuente) as (values
 ('roya_amarilla','enfermedades_foliares','Roya amarilla',5,'{"temperatura_referencia_c":[10,15],"mojado_foliar_horas_min":6,"humedad_persistente":true}'::jsonb,'Open-Meteo no observa mojado foliar ni inóculo; temperatura y humedad no prueban enfermedad.','SINAVIMO, Puccinia striiformis; umbrales preliminares a validar por Natali.'),
 ('roya_hoja','enfermedades_foliares','Roya de la hoja',5,'{"temperatura_referencia_c":[15,22],"temperatura_optima_c":20,"mojado_foliar_horas_min":6}'::jsonb,'Falta mojado foliar e inóculo.','Condiciones preliminares provistas para validación; fuente específica pendiente de revisión de Natali.'),
 ('roya_tallo','enfermedades_foliares','Roya del tallo',5,'{"temperatura_referencia_c":[19,22],"mojado_foliar_horas_min":10}'::jsonb,'Falta mojado foliar prolongado e inóculo.','Condiciones preliminares provistas para validación; fuente específica pendiente de revisión de Natali.'),
 ('mancha_amarilla','enfermedades_foliares','Mancha amarilla',7,'{"temperatura_referencia_c":[10,30],"humedad_prolongada_horas":[6,48]}'::jsonb,'No se convierte un rango bibliográfico en una regla binaria; falta duración de humedad/mojado.','Condiciones preliminares provistas para validación; fuente específica pendiente de revisión de Natali.'),
 ('septoriosis','enfermedades_foliares','Septoriosis',7,'{"temperatura_referencia_c":[15,20],"humedad_persistente":true,"llovizna_neblina_o_mojado":true}'::jsonb,'Faltan umbrales específicos, mojado foliar e inóculo.','Condiciones preliminares provistas para validación; fuente específica pendiente de revisión de Natali.'),
 ('fusariosis_espiga','enfermedades_espiga','Fusariosis de la espiga',5,'{"temperatura_referencia_c":[20,30],"humedad_elevada":true,"precipitacion_o_mojado":true,"fenologia":"floracion"}'::jsonb,'La floración y el mojado foliar son obligatorios para una evaluación completa; no están disponibles automáticamente.','Condiciones preliminares provistas para validación; fuente específica pendiente de revisión de Natali.'),
 ('baja_precipitacion','estres_hidrico','Déficit meteorológico orientativo',14,'{"formula":"ETc = Kc x ET0","kc_referencia":{"inicial":0.35,"media":1.15,"final":0.45},"variables":["precipitacion","et0_fao_56","humedad_suelo"]}'::jsonb,'Sin etapa validada, balance hídrico, profundidad radicular, tipo de suelo ni agua útil no se afirma estrés hídrico del cultivo.','FAO Irrigation and Drainage Paper 56, cap. 6; Kc y aplicación local pendientes de validación por Natali.'),
 ('precipitacion_elevada','exceso_hidrico','Posible acumulación hídrica',7,'{"variables":["precipitacion","humedad_suelo","temperatura_media"],"referencia_anegamiento_dias":[3,4]}'::jsonb,'Días de lluvia no equivalen a anegamiento: faltan saturación, infiltración, drenaje y tipo de suelo.','University of Minnesota Extension, Wheat flooding and waterlogging (revisado 2024).'),
 ('temperatura_bajo_umbral','heladas','Exposición a frío por etapa',1,'{"referencias_c":{"macollaje":-11,"encanazon":-4,"embuchado":-2,"espigazon":-1,"floracion":-1,"grano_lechoso":-2,"grano_pastoso":-2},"duracion_horas":2}'::jsonb,'La mínima diaria no prueba dos horas de exposición ni daño; requiere etapa y datos horarios.','Referencias preliminares de daño por frío provistas para validación; fuente específica pendiente de revisión de Natali.')
)
update catalogo_enfermedades c set categoria=r.categoria, condiciones_normalizadas=r.condiciones,
  factores_no_observables=array['mojado_foliar','inoculo','observacion_lote','umbral_validado_por_natali'], cobertura_esperada='INSUFICIENTE',
  fuentes=jsonb_build_array(jsonb_build_object('referencia',r.fuente)), updated_at=now()
from reglas r where c.cultivo='trigo' and c.clave=r.clave and c.version='1.0';

with reglas(clave,categoria,nombre,ventana,limitaciones,fuente) as (values
 ('baja_precipitacion','estres_hidrico','Déficit meteorológico orientativo',14,'Sin etapa validada, balance hídrico, profundidad radicular, tipo de suelo ni agua útil no se afirma estrés hídrico del cultivo.','FAO Irrigation and Drainage Paper 56, cap. 6.'),
 ('precipitacion_elevada','exceso_hidrico','Posible acumulación hídrica',7,'Días de lluvia no equivalen a anegamiento: faltan saturación, infiltración, drenaje y tipo de suelo.','University of Minnesota Extension, Wheat flooding and waterlogging (revisado 2024).'),
 ('temperatura_bajo_umbral','heladas','Exposición a frío por etapa',1,'La mínima diaria no prueba dos horas de exposición ni daño; requiere etapa y datos horarios.','Referencias preliminares de daño por frío provistas para validación.')
)
insert into reglas_agronomicas
 (cultivo,categoria_nombre,condicion,causas,recomendacion,regla_version,estado_regla,prioridad,activa,combinador,condiciones,clave,version,estado,ventana_dias,fuente_tecnica,limitaciones_declaradas,condiciones_revision,decisiones_pendientes,definicion)
select 'trigo',categoria,'desfavorable','{}','Monitorear el lote; esta evaluación está pendiente de validación agronómica por Natali.','1.0','pendiente',0,true,'all','[]',clave,'1.0','experimental',ventana,fuente,limitaciones,'Aprobar, ajustar o rechazar con Natali.',array['PENDIENTE DE VALIDACIÓN AGRONÓMICA POR NATALI'], '{"niveles":[],"sin_coincidencia":{"estado":"no_evaluable","motivo":"configuracion_incompleta"}}'::jsonb
from reglas
on conflict (cultivo,clave,version) where clave is not null do update set categoria_nombre=excluded.categoria_nombre, fuente_tecnica=excluded.fuente_tecnica, limitaciones_declaradas=excluded.limitaciones_declaradas, condiciones_revision=excluded.condiciones_revision, decisiones_pendientes=excluded.decisiones_pendientes, definicion=excluded.definicion, updated_at=now();

with plagas(grupo,nombre,umbral,unidad,fenologia) as (values
 ('pulgon_verde_cereales','Pulgón verde de los cereales','3–5 durante los primeros 15 días; 10–15 posteriormente','pulgones por planta','emergencia a macollaje'),
 ('pulgon_avena','Pulgón de la avena','20 % de plantas con 10 o más pulgones','% de plantas / pulgones por planta','período fenológico aplicable'),
 ('pulgon_espiga','Pulgón de la espiga','5 por planta o espiga; 20–30 en grano acuoso','pulgones por planta o espiga','espigazón a grano acuoso'),
 ('oruga_militar','Oruga militar verdadera','5 o 15 orugas mayores de 1,5 cm','orugas por m²','según etapa'),
 ('oruga_desgranadora','Oruga desgranadora','5–10 espigas dañadas','espigas dañadas por m²','espigazón a madurez'),
 ('chinche_verde','Chinche verde','5 chinches','chinches por m²','espiga embuchada en adelante')
)
insert into catalogo_plagas(cultivo,grupo_plaga,nombre,tipo_regla,estado_catalogo,version)
select 'trigo',grupo,nombre,'prioridad_monitoreo','catalogada','1.0' from plagas
on conflict (cultivo,grupo_plaga,(coalesce(especie,'')),version) do update set nombre=excluded.nombre, estado_catalogo='catalogada',updated_at=now();
