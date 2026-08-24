-- Operación manual para Railway/PostgreSQL. NO forma parte de db:migrate.
-- Ejecutar como propietario de la base después de crear de forma segura los roles LOGIN.
-- Las contraseñas se crean/rotan fuera de este archivo y nunca se guardan en Git.

begin;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'avizor_app') then create role avizor_app nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'avizor_migrations') then create role avizor_migrations nologin; end if;
end $$;

revoke create on schema public from public;
grant usage on schema public to avizor_app;
grant usage, create on schema public to avizor_migrations;

grant select, update on table reglas_agronomicas to avizor_app;
grant insert on table consulta_logs to avizor_app;
grant select, insert on table consultas to avizor_app;
grant insert on table interesados to avizor_app;
grant select, insert on table observaciones, feedback to avizor_app;
grant select on table api_keys to avizor_app;
grant select, insert, update on table api_uso to avizor_app;
grant insert on table auditoria to avizor_app;
grant select, insert, update on table cultivos to avizor_app;
grant insert, update, delete on table rate_limit_buckets to avizor_app;

grant usage, select on all sequences in schema public to avizor_app;

grant all privileges on all tables in schema public to avizor_migrations;
grant all privileges on all sequences in schema public to avizor_migrations;

commit;

-- Fuera de la transacción, reemplazar nombres de login por los creados en Railway:
-- grant avizor_app to avizor_app_login;
-- grant avizor_migrations to avizor_migrations_login;
-- grant connect on database <nombre_base> to avizor_app_login, avizor_migrations_login;
--
-- Para que avizor_migrations pueda ALTER/DROP, las migraciones nuevas deben ejecutarse
-- con ese rol. La transferencia de ownership de objetos existentes requiere validación
-- en staging y no se automatiza aquí.
-- Cada migración que cree una tabla debe agregar GRANT explícito para avizor_app;
-- no se conceden privilegios DML amplios por defecto a objetos futuros.
