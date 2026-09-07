"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Metodología", href: "/metodologia" },
  { label: "Sobre Avizor", href: "/sobre-avizor" },
  { label: "Contacto", href: "/contacto" },
];

const MOBILE_NAV = NAV.filter((item) => item.href !== "/contacto");
const RESOURCES = [["Bibliografía", "/bibliografia"], ["Privacidad", "/privacidad"], ["Alcance y limitaciones", "/alcance-limitaciones"], ["Estado del sistema", "/estado-sistema"]];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  useEffect(() => { setOpen(false); setResourcesOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); setResourcesOpen(false); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  function closeMobileMenu() { setOpen(false); setResourcesOpen(false); }

  return <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/45 bg-white/55 shadow-[0_4px_22px_rgba(8,26,49,.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/45">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center px-5 sm:h-[72px] sm:px-8 lg:grid lg:grid-cols-[220px_1fr_220px] lg:px-14">
        <Link href="/" aria-label="Avizor, inicio"><BrandLogo compact /></Link>
        <nav className="hidden h-full items-center justify-self-center gap-12 lg:flex" aria-label="Navegación principal">
          {NAV.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} style={{fontWeight:700}} className={`flex h-full items-center border-b-2 px-1 text-sm font-extrabold ${pathname === item.href ? "border-[#087b4b] text-[#087b4b]" : "border-transparent text-[#081a31] hover:text-[#087b4b]"}`}>{item.label}</Link>)}
        </nav>
        <Link href="/consultar" className="ml-auto hidden min-h-10 items-center justify-self-end rounded-lg bg-[#087b4b] px-5 text-xs font-bold text-white shadow-sm lg:inline-flex">Realizar consulta</Link>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} className="ml-auto flex h-12 w-12 items-center justify-center text-[#087b4b] lg:hidden">{open ? <X className="h-8 w-8" strokeWidth={2.2} /> : <Menu className="h-8 w-8" strokeWidth={2.2} />}</button>
      </div>
      <nav id="mobile-menu" aria-hidden={!open} className={`fixed inset-x-0 bottom-0 top-20 z-[60] overflow-y-auto overscroll-contain border-t border-[#e3e9e5] bg-white shadow-[0_14px_28px_rgba(8,26,49,.12)] sm:top-[72px] lg:hidden ${open ? "block" : "hidden"}`} aria-label="Menú móvil">
        <div className="px-5">
          {MOBILE_NAV.map(item => <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`flex min-h-14 items-center justify-between border-b border-[#e5ebe7] text-base font-bold ${pathname === item.href ? "text-[#087b4b]" : "text-[#081a31]"}`}><span>{item.label}</span><ChevronRight className="h-5 w-5" /></Link>)}
          <button type="button" onClick={() => setResourcesOpen((value) => !value)} aria-expanded={resourcesOpen} aria-controls="mobile-resources-menu" className="flex min-h-14 w-full items-center justify-between border-b border-[#e5ebe7] text-base font-bold text-[#081a31]"><span>Recursos</span><ChevronDown aria-hidden="true" className={`h-5 w-5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} /></button>
          {resourcesOpen && <div id="mobile-resources-menu" className="border-b border-[#e5ebe7] bg-[#f7f9f8] py-2 pl-5 pr-3">{RESOURCES.map(([label,href]) => <Link key={href} href={href} onClick={closeMobileMenu} className="flex min-h-11 items-center justify-between text-sm font-bold text-[#405369]"><span>{label}</span><ChevronRight className="h-4 w-4" /></Link>)}</div>}
          <Link href="/contacto" onClick={closeMobileMenu} className={`flex min-h-14 items-center justify-between border-b border-[#e5ebe7] text-base font-bold ${pathname === "/contacto" ? "text-[#087b4b]" : "text-[#081a31]"}`}><span>Contacto</span><ChevronRight className="h-5 w-5" /></Link>
          <Link href="/consultar" onClick={closeMobileMenu} className="my-5 flex min-h-12 items-center justify-center rounded-lg bg-[#087b4b] text-sm font-bold text-white">Realizar consulta</Link>
        </div>
      </nav>
    </header>
    <div className="h-20 sm:h-[72px]" aria-hidden="true" />
  </>;
}
