"use client";

import { useState } from "react";

const OPCIONES = [
  "Nada relevante",
  "Posibles plagas",
  "Posibles enfermedades",
  "Exceso de agua",
  "Sequía",
  "Otro",
];

export default function ObservacionLote() {
  const [seleccion, setSeleccion] = useState<string | null>(null);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        ¿Qué observás actualmente en el lote?
      </h3>
      <div className="flex flex-wrap gap-2">
        {OPCIONES.map((op) => (
          <button
            key={op}
            onClick={() => setSeleccion(seleccion === op ? null : op)}
            className={`text-sm px-4 py-2 rounded-full border transition-all ${
              seleccion === op
                ? "bg-avizor-navy border-avizor-navy text-white"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-avizor-green hover:text-avizor-green"
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}
