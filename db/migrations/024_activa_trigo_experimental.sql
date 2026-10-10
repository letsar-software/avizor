-- Activa únicamente comparaciones meteorológicas parciales: nunca usa HR como
-- mojado foliar y deja fuera del score todas las reglas experimentales.
with definiciones(clave,definicion,limitacion) as (values
 ('roya_amarilla','{"niveles":[{"orden":1,"clave":"condiciones_parciales","orden_visual":1,"etiqueta":"Evaluación experimental: temperatura compatible con roya amarilla","explicacion":"Coincide la temperatura de referencia; no se mide mojado foliar ni inóculo.","recomendacion":"Monitorear hojas y confirmar mojado foliar o síntomas en el lote.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[10,16],"unidad":"C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,'Evaluación parcial: temperatura no confirma infección; faltan mojado foliar e inóculo.'),
 ('roya_hoja','{"niveles":[{"orden":1,"clave":"condiciones_parciales","orden_visual":1,"etiqueta":"Evaluación experimental: temperatura compatible con roya de la hoja","explicacion":"Coincide la temperatura de referencia; no se mide mojado foliar ni inóculo.","recomendacion":"Monitorear hojas y confirmar condiciones de mojado en el lote.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[15,22],"unidad":"C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,'Evaluación parcial: faltan mojado foliar e inóculo.'),
 ('roya_tallo','{"niveles":[{"orden":1,"clave":"condiciones_parciales","orden_visual":1,"etiqueta":"Evaluación experimental: temperatura compatible con roya del tallo","explicacion":"Coincide la temperatura de referencia; no se mide mojado foliar prolongado ni inóculo.","recomendacion":"Monitorear tallos y hojas en el lote.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[19,30],"unidad":"C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,'Evaluación parcial: faltan mojado foliar prolongado e inóculo.'),
 ('septoriosis','{"niveles":[{"orden":1,"clave":"condiciones_parciales","orden_visual":1,"etiqueta":"Evaluación experimental: temperatura compatible con septoriosis","explicacion":"Coincide la temperatura de referencia; no se mide mojado foliar ni inóculo.","recomendacion":"Monitorear hojas bajas y registrar mojado foliar si está disponible.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[16,25],"unidad":"C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,'Evaluación parcial: faltan mojado foliar e inóculo.'),
 ('mancha_amarilla','{"niveles":[{"orden":1,"clave":"condiciones_parciales","orden_visual":1,"etiqueta":"Evaluación experimental: temperatura dentro del rango de referencia","explicacion":"No se infiere duración de humedad ni infección a partir de humedad relativa.","recomendacion":"Revisar rastrojo, mojado foliar y lesiones en el lote.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[10,30],"unidad":"C"}]}],"sin_coincidencia":{"estado":"sin_condiciones"}}'::jsonb,'Evaluación parcial: el período húmedo, rastrojo e inóculo no están medidos.'),
 ('fusariosis_espiga','{"niveles":[{"orden":1,"clave":"condiciones_parciales","orden_visual":1,"etiqueta":"Evaluación experimental: ambiente húmedo durante floración declarada","explicacion":"Coinciden temperatura y precipitaciones recientes; no mide mojado foliar ni inóculo.","recomendacion":"Monitorear espigas durante floración.","condiciones":[{"variable":"temperatura_media","agregador":"media_ventana","operador":"between","valor":[25,30],"unidad":"C"},{"variable":"precipitacion","agregador":"suma_ventana","operador":"gt","valor":0,"unidad":"mm"}]}],"sin_coincidencia":{"estado":"no_evaluable","motivo":"fenologia_o_condiciones_no_confirmadas"}}'::jsonb,'Evaluación parcial sólo con floración declarada; faltan mojado foliar e inóculo.')
)
update reglas_agronomicas r set definicion=d.definicion, limitaciones_declaradas=d.limitacion, estado='experimental', estado_regla='pendiente', activa=true, updated_at=now()
from definiciones d where r.cultivo='trigo' and r.clave=d.clave and r.version='1.0';

-- Referencias trazables; los rangos sólo habilitan coincidencias ambientales parciales.
update reglas_agronomicas set fuente_tecnica = case clave
  when 'roya_amarilla' then 'UGA Extension, Circular 960, Stripe Rust (Yellow Rust) of Wheat; SINAVIMO, Puccinia striiformis.'
  when 'roya_hoja' then 'New Mexico State University, Guide A-415, Rust Diseases of Wheat.'
  when 'roya_tallo' then 'New Mexico State University, Guide A-415, Rust Diseases of Wheat.'
  when 'mancha_amarilla' then 'University of Nebraska–Lincoln, G429, Tan Spot of Wheat.'
  when 'septoriosis' then 'UC IPM, Septoria tritici blotch of wheat.'
  when 'fusariosis_espiga' then 'UGA Extension, 2022–2023 Wheat Production Guide, Fusarium head blight.'
end, updated_at=now()
where cultivo='trigo' and version='1.0' and clave in
 ('roya_amarilla','roya_hoja','roya_tallo','mancha_amarilla','septoriosis','fusariosis_espiga');

update catalogo_enfermedades set evaluabilidad='PARCIALMENTE_EVALUABLE', modo_avizor='EXPERIMENTAL', cobertura_esperada='PARCIAL'
where cultivo='trigo' and clave in ('roya_amarilla','roya_hoja','roya_tallo','mancha_amarilla','septoriosis','fusariosis_espiga') and version='1.0';
