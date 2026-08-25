"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasAccess, type AdminModule, type AdminRole } from "@/lib/admin/permissions";

const NAV: { href: string; label: string; modulo: AdminModule }[] = [
  { href: "/admin", label: "Dashboard", modulo: "dashboard" },
  { href: "/admin/reglas", label: "Reglas", modulo: "reglas" },
  { href: "/admin/laboratorio", label: "Laboratorio", modulo: "laboratorio" },
  { href: "/admin/plagas", label: "Plagas", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/cultivos", label: "Cultivos", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/fenologia", label: "Fenología", modulo: "plagas_cultivos_fenologia" },
  { href: "/admin/usuarios", label: "Usuarios", modulo: "usuarios" },
  { href: "/admin/empresas", label: "Empresas", modulo: "empresas" },
  { href: "/admin/auditoria", label: "Auditoría", modulo: "auditoria" },
  { href: "/admin/configuracion", label: "Configuración", modulo: "configuracion" },
];

export default function AdminSidebar({ rol }: { rol: AdminRole }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => hasAccess(rol, item.modulo, "read"));

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold text-avizor-navy">Avizor</span>
        <span className="ml-2 text-xs uppercase tracking-wide text-gray-400">Admin</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-2 text-sm ${active ? "bg-avizor-green-light font-medium text-avizor-green" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
