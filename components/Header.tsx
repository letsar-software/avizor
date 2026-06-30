"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf } from "lucide-react";

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "¿Cómo funciona?", href: "/como-funciona" },
  { label: "Metodología", href: "/metodologia" },
  { label: "Sobre Avizor", href: "/sobre-avizor" },
];

function LogoMark() {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-avizor-green sm:h-11 sm:w-11">
      <span className="absolute inset-x-1 top-1 h-5 rounded-t-full border-4 border-current border-b-0" />
      <span className="absolute inset-x-1 bottom-1 h-5 rounded-b-full border-4 border-current border-t-0" />
      <span className="absolute h-3.5 w-3.5 rounded-full border-[3px] border-current" />
      <Leaf className="absolute -bottom-0.5 left-1 h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 lg:min-w-[210px]">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[20px] font-extrabold tracking-wide text-[#0b2138] sm:text-[24px]">AVIZOR</span>
        <span className="mt-1 hidden text-[11px] font-semibold tracking-normal text-[#0b2138] sm:block">La señal antes del problema.</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#dde5df] bg-white/96 backdrop-blur">
      <div className="mx-auto flex h-[68px] w-full max-w-[1320px] items-center gap-4 px-4 sm:h-[76px] sm:gap-7 sm:px-8">
        <Brand />

        <nav className="hidden flex-1 items-center justify-center gap-12 lg:flex">
          {NAV.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative flex h-[76px] items-center whitespace-nowrap text-[14px] font-extrabold transition-colors ${
                  active ? "text-avizor-green" : "text-[#0b2138] hover:text-avizor-green"
                }`}
              >
                {link.label}
                {active && <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-avizor-green" />}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => router.push("/")}
          className="ml-auto rounded-lg bg-avizor-green px-4 py-3 text-[12px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#256427] sm:px-7 sm:py-3.5 sm:text-[14px]"
        >
          {pathname === "/resultado" ? "Nueva consulta" : "Realizar consulta"}
        </button>
      </div>
    </header>
  );
}



