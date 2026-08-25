"use client";
import { useState, type FormEvent } from "react";
import type { ConsultaResultadoV2 } from "@/lib/consultas/service";

export default function RuleLab() {
  const [localidad, setLocalidad] = useState("");
  const [fechaSiembra, setFechaSiembra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConsultaResultadoV2 | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const response = await fetch("/api/admin/simulaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localidad, cultivo: "soja", ...(fechaSiembra ? { fechaSiembra } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "No pudimos correr la simulación.");
      setResultado(payload.data as ConsultaResultadoV2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos correr la simulación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label className="text-sm text-gray-700">
          Localidad
          <input
            required
            value={localidad}
            onChange={(event) => setLocalidad(event.target.value)}
            placeholder="Tandil"
            className="mt-1 block w-48 rounded border border-gray-300 px-3 py-2 text-sm focus:border-avizor-green focus:outline-none"
          />
        </label>
        <label className="text-sm text-gray-700">
          Cultivo
          <input value="Soja" disabled className="mt-1 block w-32 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </label>
        <label className="text-sm text-gray-700">
          Fecha de siembra (opcional)
          <input
            type="date"
            value={fechaSiembra}
            onChange={(event) => setFechaSiembra(event.target.value)}
            className="mt-1 block rounded border border-gray-300 px-3 py-2 text-sm focus:border-avizor-green focus:outline-none"
          />
        </label>
        <button type="submit" disabled={loading} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {loading ? "Simulando..." : "Simular"}
        </button>
      </form>

      {error && <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {resultado && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Estado general</p>
            <p className="text-lg font-semibold text-avizor-navy">{resultado.estado_general}</p>
            <p className="mt-1 text-sm text-gray-600">{resultado.explicacion}</p>
            <p className="mt-2 text-xs text-gray-400">
              {resultado.localidad ? `${resultado.localidad.nombre}, ${resultado.localidad.provincia} · ` : ""}
              datos {resultado.clima.rango_temporal.desde} a {resultado.clima.rango_temporal.hasta} · cobertura {Math.round(resultado.clima.cobertura * 100)}%
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Regla</th>
                  <th className="px-4 py-3">Estado regla</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultado.reglas.map((regla) => (
                  <tr key={`${regla.regla.clave}-${regla.regla.version}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-avizor-navy">{regla.regla.nombre ?? regla.regla.clave}</div>
                      <div className="text-xs text-gray-400">{regla.regla.categoria ?? "—"} · v{regla.regla.version}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{regla.regla.estado}</td>
                    <td className="px-4 py-3">{regla.etiqueta ?? regla.estado}</td>
                    <td className="px-4 py-3 text-gray-500">{regla.motivo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
