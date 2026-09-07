-- WEB-D-015: retention is enforced by lib/maintenance/retention.ts.
-- Detailed consultations are deleted after 18 months rather than retaining a
-- quasi-identifiable copy. Aggregates, if ever needed, must be produced from a
-- separate, reviewed aggregation process.
create index if not exists consultas_created_at_idx on consultas (created_at);
create index if not exists consulta_logs_created_at_idx on consulta_logs (created_at);
create index if not exists feedback_created_at_idx on feedback (created_at);
create index if not exists observaciones_created_at_idx on observaciones (created_at);
create index if not exists interesados_created_at_idx on interesados (created_at);
create index if not exists api_uso_created_at_idx on api_uso (created_at);
create index if not exists auditoria_created_at_idx on auditoria (created_at);

alter table interesados add column if not exists baja_en timestamptz;
alter table interesados add column if not exists ultima_interaccion_en timestamptz;
update interesados set ultima_interaccion_en = created_at where ultima_interaccion_en is null;
alter table interesados alter column ultima_interaccion_en set default now();
