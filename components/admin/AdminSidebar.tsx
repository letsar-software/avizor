"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasAccess, type AdminRole } from "@/lib/admin/permissions";
import { ADMIN_NAV } from "@/lib/admin/nav";

export default function AdminSidebar({ rol }: { rol: AdminRole }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) => hasAccess(rol, item.modulo, "read"));

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold text-sidebar-foreground">Avizor</span>
        <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">Admin</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent font-medium text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
