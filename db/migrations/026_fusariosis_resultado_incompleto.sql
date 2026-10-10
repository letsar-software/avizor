-- Con floración declarada, una temperatura o lluvia que no coincide no vuelve
-- la consulta "no evaluable": se evaluaron variables climáticas, pero faltan
-- mojado foliar e inóculo para completarla.
update reglas_agronomicas
set definicion = jsonb_set(definicion, '{sin_coincidencia}', '{"estado":"evaluacion_incompleta","motivo":"condiciones_parciales_no_confirmadas"}'::jsonb),
    updated_at = now()
where cultivo = 'trigo' and clave = 'fusariosis_espiga' and version = '1.0';
