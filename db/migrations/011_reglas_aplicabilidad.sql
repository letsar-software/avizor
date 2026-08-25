-- Generaliza reglas_agronomicas para soportar aplicabilidad (zona × fenología × período),
-- necesaria para plagas. No rompe las reglas climáticas existentes: tipo_regla default
-- 'climatica' y aplicabilidad vive dentro de definicion (jsonb), no como columnas rígidas
-- por dimensión — el propio documento de plagas dice que zona puede excluir o priorizar
-- según lo que decida Natali (PEND-15), así que el esquema no debe asumir una de las dos.

alter table reglas_agronomicas add column if not exists tipo_regla text
  not null default 'climatica' check (tipo_regla in ('climatica','prioridad_monitoreo'));

alter table reglas_agronomicas add column if not exists grupo_plaga text;   -- null para enfermedades/clima puro
alter table reglas_agronomicas add column if not exists especie text;      -- ej. 'caliothrips_phaseoli'

alter table reglas_agronomicas add column if not exists nivel_evidencia_climatica text
  check (nivel_evidencia_climatica in ('alto','medio','bajo','muy_bajo'));

create index if not exists reglas_agronomicas_grupo_plaga_idx on reglas_agronomicas (grupo_plaga) where grupo_plaga is not null;
