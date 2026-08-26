-- Cierra la taxonomía de scopes de API key también a nivel de base (antes texto
-- libre sin restricción, ver 014_empresas_api_keys.sql) — mismo patrón que el resto
-- de los enums del proyecto (estado, rol, tipo_regla): se valida tanto en la app
-- (lib/empresas/spec.ts, API_KEY_SCOPES) como acá. No hay filas existentes con scopes
-- fuera de esta lista (api_keys está vacía en producción a la fecha de esta migración).

alter table api_keys drop constraint if exists api_keys_scopes_check;
alter table api_keys add constraint api_keys_scopes_check
  check (scopes <@ array['consultas:crear']::text[]);
