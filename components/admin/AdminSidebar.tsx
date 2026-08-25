"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasAccess, type AdminRole } from "@/lib/admin/permissions";
import { ADMIN_NAV } from "@/lib/admin/nav";

export default function AdminSidebar({ rol }: { rol: AdminRole }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) => hasAccess(rol, item.modulo, "read"));

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
