-- Reversión de 031_variables_criticas_complementarias.sql.
-- Ejecutar dentro de una transacción y revisar los conteos antes de confirmar.
-- Ejecutarla antes de nuevas ediciones de reglas: restaura las columnas que 031 tocó
-- con la foto tomada antes de aplicarla y deshace sólo los vínculos que 031 creó.

begin;

-- 1) Deshace únicamente los categoria_id que creó 031 y que no se cambiaron después.
update reglas_agronomicas r
set categoria_id = null, updated_at = now()
from migracion_031_vinculos v
where r.id::text = v.regla_id and r.categoria_id = v.categoria_id;

-- 2) Restaura listas y textos desde el respaldo, sólo donde el valor actual difiere.
update reglas_agronomicas r
set critical_required_variables = b.critical_required_variables,
    complementary_required_variables = b.complementary_required_variables,
    texto_alerta = b.texto_alerta,
    texto_no_evaluable = b.texto_no_evaluable,
    nombre_regla = b.nombre_regla,
    definicion = b.definicion,
    condiciones_logicas = b.condiciones_logicas,
    updated_at = now()
from migracion_031_respaldo b
where r.id::text = b.regla_id
  and (r.critical_required_variables is distinct from b.critical_required_variables
    or r.complementary_required_variables is distinct from b.complementary_required_variables
    or r.texto_alerta is distinct from b.texto_alerta
    or r.texto_no_evaluable is distinct from b.texto_no_evaluable
    or r.nombre_regla is distinct from b.nombre_regla
    or r.definicion is distinct from b.definicion
    or r.condiciones_logicas is distinct from b.condiciones_logicas);

-- 3) Verificación: debe devolver 0 filas.
select r.id, r.cultivo, r.clave
from reglas_agronomicas r join migracion_031_respaldo b on b.regla_id = r.id::text
where r.categoria_id is distinct from b.categoria_id;

-- 4) Opcional, una vez verificada la reversión (columnas vacías y tablas auxiliares):
-- alter table reglas_agronomicas drop column critical_required_variables;
-- alter table reglas_agronomicas drop column complementary_required_variables;
-- drop table migracion_031_vinculos;
-- drop table migracion_031_respaldo;
-- delete from schema_migrations where filename = 'db/migrations/031_variables_criticas_complementarias.sql';

-- commit;  -- confirmar manualmente tras revisar los resultados
rollback;
