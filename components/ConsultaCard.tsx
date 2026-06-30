"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function ConsultaCard() {
  const router = useRouter();
  const [localidad, setLocalidad] = useState("Tandil, Buenos Aires");

  function handleConsultar(e: React.FormEvent) {
    e.preventDefault();
    router.push("/resultado");
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-avizor-navy">
        Consultá las condiciones de tu lote
      </h2>
      <p className="text-sm text-gray-400 mt-1">
        Obtené una señal clara en menos de 30 segundos.
      </p>

      <form onSubmit={handleConsultar}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mt-5 items-end">
          {/* Localidad */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Localidad
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                📍
              </span>
              <input
                type="text"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder="Ej: Tandil, Buenos Aires"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-avizor-green focus:border-transparent"
              />
              {localidad && (
                <button
                  type="button"
                  onClick={() => setLocalidad("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 p-1 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cultivo */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Cultivo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                🌱
              </span>
              <select
                defaultValue="soja"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-3 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-avizor-green focus:border-transparent"
              >
                <option value="soja">Soja</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="bg-avizor-green hover:bg-[#256427] text-white font-semibold rounded-lg px-6 py-3 text-sm flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            Consultar
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          ¿Querés mejorar la precisión? Agregá la fecha de siembra después del resultado. 📅
        </p>
      </form>
    </div>
  );
}
