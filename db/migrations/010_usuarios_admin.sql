-- Usuarios y sesiones del panel de administración.
-- Sesión por cookie httpOnly + tabla propia; sin proveedor de identidad externo
-- (plan de arquitectura del panel admin, sección 3.4). No hay SSO: alcanza para 3-5 usuarios internos.

create table if not exists usuarios_admin (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('administrador','agronomo','soporte')),
  password_hash text,
  estado text not null default 'invitado' check (estado in ('invitado','activo','inactivo','bloqueado')),
  invitado_por uuid references usuarios_admin(id),
  ultimo_acceso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sesiones_admin (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios_admin(id),
  token_hash text not null unique,
  expira_en timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sesiones_admin_usuario_id_idx on sesiones_admin(usuario_id);
create index if not exists sesiones_admin_expira_en_idx on sesiones_admin(expira_en);
