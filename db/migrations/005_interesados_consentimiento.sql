alter table interesados add column if not exists nombre_lote text;
alter table interesados add column if not exists consentimiento boolean not null default false;
alter table interesados add column if not exists consentimiento_version text;
alter table interesados add column if not exists consentimiento_fecha timestamptz;

alter table interesados drop constraint if exists interesados_consentimiento_completo_check;
alter table interesados add constraint interesados_consentimiento_completo_check check (
  consentimiento = false or (consentimiento_version is not null and consentimiento_fecha is not null)
);
