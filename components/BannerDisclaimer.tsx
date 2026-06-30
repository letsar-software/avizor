import { Info } from "lucide-react";
import Link from "next/link";

export default function BannerDisclaimer() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Info size={20} className="text-avizor-green flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-800 text-sm">
            Avizor no reemplaza al asesor agronómico.
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            La información es una herramienta para ayudarte a decidir.
          </p>
        </div>
      </div>
      <Link
        href="/metodologia"
        className="text-sm text-avizor-green font-medium hover:underline flex items-center gap-1 flex-shrink-0 ml-4 whitespace-nowrap"
      >
        Ver metodología →
      </Link>
    </div>
  );
}
