import Image from "next/image";

export default function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const width = compact ? 165 : 220;
  const height = compact ? 50 : 64;
  const logo = (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${inverse ? "rounded-lg" : "rounded-md"}`}
      style={{ width, height }}
    >
      <Image
        src="/logo-mod-avizor.png"
        alt="AVIZOR — La señal antes del problema."
        width={1536}
        height={1024}
        priority
        className={`pointer-events-none absolute max-w-none ${inverse ? "mix-blend-screen brightness-[1.8] contrast-125" : ""}`}
        style={{
          width: width * 1.26,
          height: "auto",
          left: width * -0.11,
          top: height * -0.78,
        }}
      />
    </span>
  );

  return (
    <span className="inline-flex" aria-label="Avizor. La señal antes del problema.">
      {logo}
    </span>
  );
}