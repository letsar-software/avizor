-- Una temperatura fuera del rango no vuelve completa una evaluación que aún
-- carece de mojado foliar e inóculo. Conserva el valor observado y evita que
-- la UI lo presente como ausencia de condiciones.
update reglas_agronomicas
set definicion = jsonb_set(definicion, '{sin_coincidencia,estado}', '"evaluacion_incompleta"'::jsonb),
    updated_at = now()
where cultivo = 'trigo'
  and version = '1.0'
  and clave in ('roya_amarilla', 'roya_hoja', 'roya_tallo', 'mancha_amarilla', 'septoriosis');
