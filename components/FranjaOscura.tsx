import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function FranjaOscura() {
  return (
    <section className="bg-avizor-navy py-10 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <ShieldCheck size={32} className="text-avizor-green flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Transparente. Responsable. Confiable.</p>
            <p className="text-sm text-white/70 mt-1">
              Mostramos cÃ³mo llegamos a cada resultado, para que entiendas y decidas.
            </p>
          </div>
        </div>
        <Link
          href="/metodologia"
          className="border border-white/30 text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-white/10 flex items-center gap-2 whitespace-nowrap transition-colors"
        >
          ConocÃ© nuestra metodologÃ­a â†’
        </Link>
      </div>
    </section>
  );
}

