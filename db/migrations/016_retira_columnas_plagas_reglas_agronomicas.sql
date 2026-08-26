-- Retira la generalización de reglas_agronomicas que había hecho la migración 011
-- para soportar plagas (tipo_regla/grupo_plaga/especie/nivel_evidencia_climatica +
-- aplicabilidad dentro de definicion). Decisión: el motor de plagas que corre en
-- producción es lib/pests/engine.ts sobre reglas_plagas (migración 013), no
-- engine-v2.ts sobre reglas_agronomicas. Ninguna fila de reglas_agronomicas llegó a
-- usar estas columnas (siempre 'climatica'/null desde que existen), así que no hay
-- pérdida de datos. Ver docs/panel-admin-fase-0-1.md, sección "Hallazgo".

drop index if exists reglas_agronomicas_grupo_plaga_idx;

alter table reglas_agronomicas drop column if exists tipo_regla;
alter table reglas_agronomicas drop column if exists grupo_plaga;
alter table reglas_agronomicas drop column if exists especie;
alter table reglas_agronomicas drop column if exists nivel_evidencia_climatica;
