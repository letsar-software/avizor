-- Invitaciones de usuarios admin: el alta deja de fijar una contraseña elegida por
-- el administrador (punto 4 del documento de pendientes del panel admin). El usuario
-- nace en estado 'invitado' (ya soportado por 010_usuarios_admin.sql) y define su propia
-- contraseña al aceptar un enlace de un solo uso. No hay infraestructura de envío de
-- email en el proyecto (ver "Notificaciones e Integraciones" en panel-admin-fase-0-1.md),
-- así que el enlace se genera y se muestra una sola vez en el panel — mismo patrón que
-- la clave de una API key nueva (fase 5) — para que el administrador lo copie y lo
-- comparta por el canal que use hoy.

create table if not exists invitaciones_admin (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios_admin(id),
  token_hash text not null unique,
  expira_en timestamptz not null,
  aceptada_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invitaciones_admin_usuario_id_idx on invitaciones_admin(usuario_id);
