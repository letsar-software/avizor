"use client";

import { useState } from "react";

export default function FeedbackModule() {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [sugerencia, setSugerencia] = useState("");
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-avizor-green font-medium">
          ✓ Gracias por tu feedback. Nos ayuda a mejorar Avizor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">
        ¿Las condiciones que describe Avizor coinciden con lo que ves en el campo?
      </h3>
      <div className="flex gap-3 mt-3">
        {["Sí", "Parcialmente", "No"].map((opcion) => (
          <button
            key={opcion}
            onClick={() => setSeleccion(opcion)}
            className={`flex-1 border rounded-lg py-2 text-sm transition-colors ${
              seleccion === opcion
                ? "bg-avizor-green text-white border-avizor-green"
                : "border-gray-200 text-gray-600 hover:border-avizor-green"
            }`}
          >
            {opcion}
          </button>
        ))}
      </div>
      <div>
        <label className="text-sm text-gray-600 block mb-1">
          ¿Qué te gustaría que Avizor incorpore?
        </label>
        <textarea
          value={sugerencia}
          onChange={(e) => setSugerencia(e.target.value)}
          placeholder="Tu sugerencia..."
          className="w-full h-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-avizor-green resize-none"
        />
      </div>
      {(seleccion || sugerencia.trim()) && (
        <button
          onClick={() => setEnviado(true)}
          className="text-sm text-avizor-green font-medium hover:underline"
        >
          Enviar feedback
        </button>
      )}
    </div>
  );
}
