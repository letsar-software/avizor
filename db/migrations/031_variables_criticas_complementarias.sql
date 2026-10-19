-- Separa variables críticas (sin ellas la regla no se calcula ni eleva el riesgo)
-- de complementarias (mejoran la recomendación y se piden como dato, sin
-- bloquear el cálculo), corrige textos visibles de reglas configurables y vincula
-- reglas sin categoría con su categoría administrable.
--
-- Seguridad:
--   * Idempotente: puede ejecutarse más de una vez sin cambios adicionales.
--   * Nunca sobrescribe un categoria_id existente ni listas de variables ya cargadas.
--   * Vincula sólo con una única categoría candidata, derivada de la clave estable de
--     la regla (clave climática, catálogo sanitario por cultivo+clave) o de su
--     categoria_nombre cuando coincide con una clave de categoría. Ante cero o más de
--     una candidata la regla no se toca y queda en el reporte (db/operations/031_impacto.sql).
--   * Respaldo previo en migracion_031_respaldo y registro de vínculos en
--     migracion_031_vinculos; reversión en db/operations/031_rollback.sql.
-- No ejecutar en producción sin revisar antes el reporte de impacto sobre una copia.

alter table reglas_agronomicas add column if not exists critical_required_variables text[];
alter table reglas_agronomicas add column if not exists complementary_required_variables text[];
comment on column reglas_agronomicas.critical_required_variables is
  'Indispensables para calcular la regla. Si es null, variables_requeridas se interpreta como críticas.';
comment on column reglas_agronomicas.complementary_required_variables is
  'Mejoran la recomendación o el monitoreo; si faltan, la regla se evalúa igual y se muestran en "Para completar la evaluación".';

-- Respaldo de los valores que esta migración puede modificar. Cada regla se respalda
-- una sola vez: una segunda ejecución conserva la foto original.
create table if not exists migracion_031_respaldo (
  regla_id text primary key,
  categoria_id uuid,
  critical_required_variables text[],
  complementary_required_variables text[],
  texto_alerta text,
  texto_no_evaluable text,
  nombre_regla text,
  definicion jsonb,
  condiciones_logicas jsonb,
  respaldado_en timestamptz not null default now()
);
insert into migracion_031_respaldo (
  regla_id, categoria_id, critical_required_variables, complementary_required_variables,
  texto_alerta, texto_no_evaluable, nombre_regla, definicion, condiciones_logicas
)
select id::text, categoria_id, critical_required_variables, complementary_required_variables,
  texto_alerta, texto_no_evaluable, nombre_regla, definicion, condiciones_logicas
from reglas_agronomicas
on conflict (regla_id) do nothing;

-- Vínculos creados por esta migración (la reversión sólo deshace estos).
create table if not exists migracion_031_vinculos (
  regla_id text primary key,
  categoria_id uuid not null,
  vinculado_en timestamptz not null default now()
);

with senales as (
  select r.id, case r.clave
      when 'temperatura_bajo_umbral' then 'heladas'
      when 'baja_precipitacion' then 'estres_hidrico'
      when 'precipitacion_elevada' then 'exceso_hidrico'
    end as categoria_clave
  from reglas_agronomicas r
  union all
  select r.id, 'enfermedades_foliares'
  from reglas_agronomicas r
  where exists (select 1 from catalogo_enfermedades c where c.cultivo = r.cultivo and c.clave = r.clave)
  union all
  select r.id, r.categoria_nombre
  from reglas_agronomicas r
  where exists (select 1 from categorias_agronomicas ca where ca.clave = r.categoria_nombre)
),
candidatos as (
  select s.id, array_agg(distinct s.categoria_clave) as claves
  from senales s
  join categorias_agronomicas ca on ca.clave = s.categoria_clave
  group by s.id
),
vinculadas as (
  update reglas_agronomicas r
  set categoria_id = ca.id, updated_at = now()
  from candidatos c
  join categorias_agronomicas ca on ca.clave = c.claves[1]
  where r.id = c.id
    and r.categoria_id is null
    and cardinality(c.claves) = 1
  returning r.id, r.categoria_id
)
insert into migracion_031_vinculos (regla_id, categoria_id)
select id::text, categoria_id from vinculadas
on conflict (regla_id) do nothing;

-- Roya amarilla alternativa (Open-Meteo): sólo temperatura es crítica.
update reglas_agronomicas
set critical_required_variables = array['temperatura_media'],
    complementary_required_variables = array['leaf_wetness_hours', 'codigo_zadoks', 'cultivar_susceptibilidad', 'observacion_manual'],
    updated_at = now()
where cultivo = 'trigo' and clave = 'roya_amarilla' and version = '1.0'
  and critical_required_variables is null and complementary_required_variables is null;

-- Roya amarilla completa: temperatura y mojado foliar son críticos.
update reglas_agronomicas
set critical_required_variables = array['temperatura_media', 'leaf_wetness_hours'],
    complementary_required_variables = array['codigo_zadoks', 'cultivar_susceptibilidad', 'observacion_manual'],
    updated_at = now()
where cultivo = 'trigo' and clave = 'roya_amarilla_mojado_foliar' and version = '1.0'
  and critical_required_variables is null and complementary_required_variables is null;

-- Exceso hídrico: la precipitación acumulada es crítica; suelo, drenaje,
-- observación y etapa completan la evaluación.
update reglas_agronomicas
set critical_required_variables = array['precipitacion'],
    complementary_required_variables = array['humedad_suelo_0_1cm', 'estado_drenaje', 'observacion_manual', 'codigo_zadoks'],
    updated_at = now()
where clave = 'precipitacion_elevada'
  and critical_required_variables is null and complementary_required_variables is null;

-- Textos visibles de roya amarilla (columnas de texto): sólo si conservan el texto anterior.
update reglas_agronomicas
set texto_alerta = 'La temperatura es compatible con roya amarilla.', updated_at = now()
where cultivo = 'trigo' and clave = 'roya_amarilla'
  and texto_alerta = 'Temperatura favorable para roya amarilla; no se pudo confirmar el requisito de ≥6 h de mojado foliar.';
update reglas_agronomicas
set texto_no_evaluable = 'Monitorear el lote mientras se completa la temperatura media del período.', updated_at = now()
where cultivo = 'trigo' and clave = 'roya_amarilla'
  and texto_no_evaluable = 'No se pudo evaluar la vigilancia térmica porque falta temperatura.';
update reglas_agronomicas
set texto_no_evaluable = 'La evaluación completa de roya amarilla se apoya en horas de mojado foliar medidas o calculadas por un modelo calibrado.', updated_at = now()
where cultivo = 'trigo' and clave = 'roya_amarilla_mojado_foliar'
  and texto_no_evaluable = 'No se pudo evaluar la regla completa porque faltan horas de mojado foliar medidas o calibradas.';

-- Nombre visible: la regla completa de roya amarilla no tiene ficha en el catálogo, así
-- que su nombre llega a la tarjeta. Es la misma enfermedad: se muestra como tal.
update reglas_agronomicas
set nombre_regla = 'Roya amarilla', updated_at = now()
where cultivo = 'trigo' and clave = 'roya_amarilla_mojado_foliar'
  and nombre_regla = 'Roya amarilla — mojado foliar medido';

-- Textos visibles de niveles (etiqueta / explicacion): reemplazo exacto por regla,
-- en definicion y condiciones_logicas. Un texto ya corregido no vuelve a cambiar.
do $$
declare p record;
begin
  for p in select * from (values
    ('trigo', 'roya_amarilla', 'Temperatura favorable para roya amarilla; no se pudo confirmar el requisito de ≥6 h de mojado foliar.', 'La temperatura es compatible con roya amarilla.'),
    ('trigo', 'roya_amarilla', 'Evaluación experimental: temperatura compatible con roya amarilla', 'La temperatura es compatible con roya amarilla.'),
    ('trigo', 'roya_amarilla', 'Coincide la temperatura de referencia; no se mide mojado foliar ni inóculo.', 'La temperatura es compatible con roya amarilla.'),
    ('trigo', 'roya_hoja', 'Evaluación experimental: temperatura compatible con roya de la hoja', 'Temperatura compatible con roya de la hoja'),
    ('trigo', 'roya_hoja', 'Coincide la temperatura de referencia; no se mide mojado foliar ni inóculo.', 'La temperatura es compatible con roya de la hoja.'),
    ('trigo', 'roya_tallo', 'Evaluación experimental: temperatura compatible con roya del tallo', 'Temperatura compatible con roya del tallo'),
    ('trigo', 'roya_tallo', 'Coincide la temperatura de referencia; no se mide mojado foliar prolongado ni inóculo.', 'La temperatura es compatible con roya del tallo.'),
    ('trigo', 'septoriosis', 'Evaluación experimental: temperatura compatible con septoriosis', 'Temperatura compatible con septoriosis'),
    ('trigo', 'septoriosis', 'Coincide la temperatura de referencia; no se mide mojado foliar ni inóculo.', 'La temperatura es compatible con septoriosis.'),
    ('trigo', 'mancha_amarilla', 'Evaluación experimental: temperatura dentro del rango de referencia', 'Temperatura dentro del rango de referencia para mancha amarilla'),
    ('trigo', 'mancha_amarilla', 'No se infiere duración de humedad ni infección a partir de humedad relativa.', 'La temperatura del período está dentro del rango de referencia para mancha amarilla.'),
    ('trigo', 'fusariosis_espiga', 'Evaluación experimental: ambiente húmedo durante floración declarada', 'Ambiente húmedo durante floración declarada'),
    ('trigo', 'fusariosis_espiga', 'Coinciden temperatura y precipitaciones recientes; no mide mojado foliar ni inóculo.', 'La temperatura y las lluvias recientes son compatibles con fusariosis durante floración.'),
    ('soja', 'tizon_bacteriano', 'Coincidencia experimental con ambiente de tizón bacteriano', 'Ambiente compatible con tizón bacteriano'),
    ('soja', 'pustula_bacteriana', 'Coincidencia experimental con ambiente de pústula bacteriana', 'Ambiente compatible con pústula bacteriana')
  ) as v(cultivo, clave, old_text, new_text) loop
    update reglas_agronomicas
    set definicion = replace(definicion::text, p.old_text, p.new_text)::jsonb,
        condiciones_logicas = case when condiciones_logicas is null then null
          else replace(condiciones_logicas::text, p.old_text, p.new_text)::jsonb end,
        updated_at = now()
    where cultivo = p.cultivo and clave = p.clave
      and position(p.old_text in coalesce(definicion::text, '') || coalesce(condiciones_logicas::text, '')) > 0;
  end loop;
end $$;
