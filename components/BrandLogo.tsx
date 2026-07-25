import Image from "next/image";

export default function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const width = compact ? 150 : 205;
  const height = compact ? 40 : 55;
  const logo = (
    <span className="relative inline-block shrink-0 overflow-hidden" style={{ width, height }}>
      <Image src="/logo-avizor.png" alt="AVIZOR — La señal antes del problema." width={1984} height={793} priority className="pointer-events-none absolute max-w-none" style={{ width: width * 1.118, height: "auto", left: width * -0.063, top: height * -0.31 }} />
    </span>
  );
  return inverse ? <span className="inline-flex rounded-xl bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,.12)]" aria-label="Avizor. La señal antes del problema.">{logo}</span> : <span className="inline-flex" aria-label="Avizor. La señal antes del problema.">{logo}</span>;
}
