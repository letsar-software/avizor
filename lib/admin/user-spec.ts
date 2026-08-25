// Fuente única de los enums de usuarios del panel admin (plan §3.4).
// lib/admin/auth.ts, lib/security/validation.ts y la UI de usuarios derivan de acá.
export const ADMIN_ROLES = ["administrador", "agronomo", "soporte"] as const;
export const ADMIN_USER_ESTADOS = ["invitado", "activo", "inactivo", "bloqueado"] as const;
