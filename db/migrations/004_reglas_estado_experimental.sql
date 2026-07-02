alter table reglas_agronomicas
  add column if not exists estado_regla text not null default 'experimental';

alter table reglas_agronomicas
  drop constraint if exists reglas_agronomicas_estado_regla_check;

alter table reglas_agronomicas
  add constraint reglas_agronomicas_estado_regla_check
  check (estado_regla in ('validada', 'experimental', 'pendiente'));

alter table reglas_agronomicas
  drop constraint if exists reglas_agronomicas_condiciones_array_check;

alter table reglas_agronomicas
  add constraint reglas_agronomicas_condiciones_array_check
  check (jsonb_typeof(condiciones) = 'array');

update reglas_agronomicas
set estado_regla = 'experimental'
where estado_regla is null
   or estado_regla not in ('validada', 'experimental', 'pendiente');

create index if not exists reglas_agronomicas_cultivo_estado_activa_idx
  on reglas_agronomicas (cultivo, estado_regla, activa, prioridad desc);