"use client";

import { useState } from "react";

export default function GuardarSinLogin() {
  const [email, setEmail] = useState("");
  const [guardado, setGuardado] = useState(false);

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setGuardado(true);
  }

  return (
    <div className="bg-avizor-green-light border border-[#c8e6c9] rounded-xl p-5">
      <h3 className="font-semibold text-avizor-navy text-sm mb-3">
        ¿Querés recibir un aviso si las condiciones cambian?
      </h3>
      {guardado ? (
        <p className="text-sm text-avizor-green font-medium">
          ✓ Consulta guardada. Te avisamos si algo cambia.
        </p>
      ) : (
        <>
          <form onSubmit={handleGuardar} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-avizor-green bg-white"
            />
            <button
              type="submit"
              className="bg-avizor-green hover:bg-[#256427] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Guardar
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Sin contraseña. Sin spam. Solo te avisamos si algo cambia.
          </p>
        </>
      )}
    </div>
  );
}
