import Image from "next/image";

export default function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  if (inverse) {
    const width = compact ? 190 : 220;
    const height = compact ? 50 : 58;
    return (
      <span className="inline-flex" aria-label="Avizor. La señal antes del problema.">
        <Image
          src="/logo-avizor-footer.svg"
          alt="AVIZOR — La señal antes del problema."
          width={220}
          height={58}
          className="h-auto object-contain object-left"
          style={{ width, height }}
        />
      </span>
    );
  }

  const width = compact ? 165 : 220;
  const height = compact ? 50 : 64;
  const logo = (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-md"
      style={{ width, height }}
    >
      <Image
        src="/logo-mod-avizor.png"
        alt="AVIZOR — La señal antes del problema."
        width={1536}
        height={1024}
        priority
        className="pointer-events-none absolute max-w-none"
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
