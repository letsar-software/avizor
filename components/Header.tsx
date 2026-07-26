"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Metodología", href: "/metodologia" },
  { label: "Sobre Avizor", href: "/sobre-avizor" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/45 bg-white/55 shadow-[0_4px_22px_rgba(8,26,49,.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/45">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center px-4 sm:h-[72px] sm:px-8 lg:px-14">
        <Link href="/" aria-label="Avizor, inicio"><BrandLogo compact /></Link>
        <nav className="mx-auto hidden h-full items-center gap-9 lg:flex" aria-label="Navegación principal">
          {NAV.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex h-full items-center border-b-2 px-1 text-xs font-semibold ${pathname === item.href ? "border-[#087b4b] text-[#087b4b]" : "border-transparent text-[#081a31] hover:text-[#087b4b]"}`}>{item.label}</Link>)}
        </nav>
        <Link href="/consultar" className="ml-auto hidden min-h-10 items-center rounded-lg bg-[#087b4b] px-5 text-xs font-semibold text-white shadow-sm lg:inline-flex">Realizar consulta</Link>
        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg border bg-white/70 lg:hidden">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav id="mobile-menu" className="border-t bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden" aria-label="Menú móvil">{NAV.map(item => <Link key={item.href} href={item.href} className={`block min-h-11 rounded-lg px-3 py-3 text-sm font-semibold ${pathname === item.href ? "bg-green-50 text-[#087b4b]" : "text-[#081a31]"}`}>{item.label}</Link>)}</nav>}
    </header>
    <div className="h-16 sm:h-[72px]" aria-hidden="true" />
  </>;
}
