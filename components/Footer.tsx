import { Leaf } from "lucide-react";

function LogoMark() {
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white">
      <span className="absolute inset-x-1 top-1 h-5 rounded-t-full border-4 border-current border-b-0" />
      <span className="absolute inset-x-1 bottom-1 h-5 rounded-b-full border-4 border-current border-t-0" />
      <span className="absolute h-3.5 w-3.5 rounded-full border-[3px] border-current" />
      <Leaf className="absolute -bottom-0.5 left-1 h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

export default function Footer() {
  return (
    <footer id="contacto" className="bg-[linear-gradient(135deg,#063f2c,#08733f)] text-white">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-8 py-7 md:grid-cols-3 md:items-center">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-[24px] font-extrabold tracking-[0.08em]">AVIZOR</p>
            <p className="text-[13px] text-white/85">La señal antes del problema.</p>
          </div>
        </div>
        <div className="text-[14px] leading-relaxed md:text-center">
          <p className="font-bold">Creado por Andrea ♡</p>
          <p className="text-white/85">Apasionada por el agro y la tecnología.</p>
        </div>
        <p className="text-[14px] text-white/90 md:text-right">© 2026 Avizor. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
