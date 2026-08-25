"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { REGIONAL_PRIORIDADES } from "@/lib/rules/condition-spec";
import type { ZonaAgronomica } from "@/types";

export default function RegionalForm({ plagaId, zonas }: { plagaId: string; zonas: ZonaAgronomica[] }) {
  const router = useRouter();
  const [zonaId, setZonaId] = useState(zonas[0]?.id ?? "");
  const [prioridad, setPrioridad] = useState(REGIONAL_PRIORIDADES[0]);
  const [mesesDesde, setMesesDesde] = useState("");
  const [mesesHasta, setMesesHasta] = useState("");
  const [fuenteId, setFuenteId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/plagas/${plagaId}/regionales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zona_id: zonaId,
          prioridad,
          meses_desde: mesesDesde ? Number(mesesDesde) : undefined,
          meses_hasta: mesesHasta ? Number(mesesHasta) : undefined,
          fuente_id: fuenteId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos agregar la zona.");
      setMesesDesde("");
      setMesesHasta("");
      setFuenteId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos agregar la zona.");
    } finally {
      setSaving(false);
    }
  }

  if (zonas.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay zonas cargadas — creá una en <a href="/admin/zonas" className="text-avizor-green hover:underline">Zonas</a> primero.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <label className="text-sm text-gray-700">
        Zona
        <select value={zonaId} onChange={(event) => setZonaId(event.target.value)} className={`${FIELD_INPUT_CLASS} w-48`}>
          {zonas.map((zona) => <option key={zona.id} value={zona.id}>{zona.nombre}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Prioridad
        <select value={prioridad} onChange={(event) => setPrioridad(event.target.value as typeof prioridad)} className={`${FIELD_INPUT_CLASS} w-36`}>
          {REGIONAL_PRIORIDADES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Mes desde
        <input type="number" min={1} max={12} value={mesesDesde} onChange={(event) => setMesesDesde(event.target.value)} className={`${FIELD_INPUT_CLASS} w-24`} />
      </label>
      <label className="text-sm text-gray-700">
        Mes hasta
        <input type="number" min={1} max={12} value={mesesHasta} onChange={(event) => setMesesHasta(event.target.value)} className={`${FIELD_INPUT_CLASS} w-24`} />
      </label>
      <label className="text-sm text-gray-700">
        Fuente
        <input value={fuenteId} onChange={(event) => setFuenteId(event.target.value)} placeholder="Natali 14-08" className={`${FIELD_INPUT_CLASS} w-48`} />
      </label>
      <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Agregando..." : "Agregar zona a la plaga"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
