import type { AdminRole } from "@/lib/admin/auth";

export type { AdminRole };

// Matriz de permisos del panel admin — plan de arquitectura, sección 3.4 (AF v3.0 §10, CU-017 a CU-030).
export type AdminModule =
  | "dashboard"
  | "reglas"
  | "reglas_promover"
  | "laboratorio"
  | "plagas_cultivos_fenologia"
  | "usuarios"
  | "empresas"
  | "auditoria"
  | "configuracion";

export type AdminAccess = "none" | "read" | "support" | "write";

const MATRIX: Record<AdminModule, Record<AdminRole, AdminAccess>> = {
  dashboard: { administrador: "read", agronomo: "read", soporte: "read" },
  reglas: { administrador: "write", agronomo: "write", soporte: "none" },
  reglas_promover: { administrador: "write", agronomo: "none", soporte: "none" },
  laboratorio: { administrador: "write", agronomo: "write", soporte: "none" },
  plagas_cultivos_fenologia: { administrador: "write", agronomo: "write", soporte: "none" },
  usuarios: { administrador: "write", agronomo: "none", soporte: "none" },
  // Agrónomo: "soporte (lectura + atención)" — puede leer y atender empresas, pero no administrarlas.
  empresas: { administrador: "write", agronomo: "support", soporte: "read" },
  auditoria: { administrador: "read", agronomo: "none", soporte: "none" },
  configuracion: { administrador: "write", agronomo: "none", soporte: "none" },
};

const RANK: Record<AdminAccess, number> = { none: 0, read: 1, support: 1, write: 2 };

export function accessFor(rol: AdminRole, modulo: AdminModule): AdminAccess {
  return MATRIX[modulo][rol];
}

export function hasAccess(rol: AdminRole, modulo: AdminModule, required: "read" | "write") {
  return RANK[accessFor(rol, modulo)] >= RANK[required];
}
