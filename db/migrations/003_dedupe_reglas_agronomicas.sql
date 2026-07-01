delete from reglas_agronomicas
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by cultivo, categoria_nombre, condicion, regla_version
        order by created_at, id
      ) as duplicate_rank
    from reglas_agronomicas
  ) ranked_rules
  where duplicate_rank > 1
);

create unique index if not exists reglas_agronomicas_unique_rule_idx
  on reglas_agronomicas (cultivo, categoria_nombre, condicion, regla_version);
