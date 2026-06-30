"use client";

import { useState } from "react";

export default function CompartirSection() {
  const [copiado, setCopiado] = useState(false);

  function handleCopiar() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          "Consulté las condiciones para soja en Tandil con Avizor."
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors"
      >
        📤 Compartir por WhatsApp
      </a>
      <button
        onClick={handleCopiar}
        className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 rounded-lg px-5 py-3 text-sm font-medium hover:border-avizor-green hover:text-avizor-green transition-colors"
      >
        {copiado ? "✓ Copiado" : "🔗 Copiar enlace"}
      </button>
    </div>
  );
}
