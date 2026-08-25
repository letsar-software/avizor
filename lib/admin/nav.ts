import type { AdminModule } from "@/lib/admin/permissions";

export interface AdminNavItem { href: string; label: string; modulo: AdminModule }

// Config de navegación del panel. Agregar una página nueva es una línea acá;
// la visibilidad se resuelve sola contra la matriz de lib/admin/permissions.ts.
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", modulo: "dashboard" },
  { href: "/admin/reglas", label: "Reglas", modulo: "reglas" },
  { href: "/admin/laboratorio", label: "Laboratorio", modulo: "laboratorio" },
  { href: "/admin/plagas", label: "Plagas", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/zonas", label: "Zonas", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/cultivos", label: "Cultivos", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/fenologia", label: "Fenología", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/usuarios", label: "Usuarios", modulo: "usuarios" },
  { href: "/admin/empresas", label: "Empresas", modulo: "empresas" },
  { href: "/admin/auditoria", label: "Auditoría", modulo: "auditoria" },
  { href: "/admin/configuracion", label: "Configuración", modulo: "configuracion" },
];
