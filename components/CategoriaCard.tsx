"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MiniGrafico from "./MiniGrafico";

export interface DatoRow {
  label: string;
  valor: string;
  Icon: LucideIcon;
}

export interface CategoriaData {
  id: string;
  nombre: string;
  Icon: LucideIcon;
  condicion: "moderada" | "desfavorable";
  descripcion: string;
  datos: DatoRow[];
  recomendacion: string;
  defaultOpen?: boolean;
}

export default function CategoriaCard({ cat }: { cat: CategoriaData }) {
  const [open, setOpen] = useState(cat.defaultOpen ?? false);

  const badgeClass =
    cat.condicion === "moderada"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-500";

  const badgeLabel =
    cat.condicion === "moderada" ? "Condiciones moderadas" : "Condiciones desfavorables";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-avizor-green-light flex items-center justify-center text-avizor-green flex-shrink-0">
            <cat.Icon size={18} />
          </div>
          <span className="font-semibold text-gray-800 text-sm">{cat.nombre}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
            {badgeLabel}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Contenido expandido */}
      {open && (
        <div className="border-t border-gray-50 px-5 pt-4 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda — datos */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                ¿Qué está viendo Avizor?
              </p>
              {cat.datos.map((d) => (
                <div
                  key={d.label}
                  className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <d.Icon size={14} className="text-avizor-green flex-shrink-0" />
                    <span className="text-sm text-gray-600">{d.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-avizor-navy tabular-nums text-sm">
                    {d.valor}
                  </span>
                </div>
              ))}
            </div>

            {/* Columna derecha — mini gráfico */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Evolución últimos 14 días
              </p>
              <MiniGrafico />
            </div>
          </div>

          {/* Recomendación */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Recomendación
            </p>
            <p className="text-sm text-gray-700 mt-1">{cat.recomendacion}</p>
            <div className="flex justify-end mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <ShieldCheck size={12} className="text-avizor-green" />
                Basado en 14 días completos de datos climáticos
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
