"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { DEFAULT_PARAMETROS_FENOLOGICOS } from "@/lib/phenology/provider";
import { useModeloParametrosEditor } from "@/components/admin/fenologia/useModeloParametrosEditor";
import ParametrosGrid from "@/components/admin/fenologia/ParametrosGrid";
import type { ModeloFenologicoParametros } from "@/types";

export default function ModeloCreateForm({ basadoEn }: { basadoEn?: ModeloFenologicoParametros }) {
  const router = useRouter();
  const [cultivo, setCultivo] = useState("soja");
  const [version, setVersion] = useState("");
  const [fuenteTecnica, setFuenteTecnica] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editor = useModeloParametrosEditor(basadoEn ?? DEFAULT_PARAMETROS_FENOLOGICOS);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/fenologia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cultivo, version, fuente_tecnica: fuenteTecnica || undefined, parametros: editor.parametros }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear el modelo.");
      router.push(`/admin/fenologia/${data.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear el modelo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <label className="text-sm text-gray-700">
          Cultivo
          <input required value={cultivo} onChange={(event) => setCultivo(event.target.value)} className={FIELD_INPUT_CLASS} />
        </label>
        <label className="text-sm text-gray-700">
          Versión
          <input required value={version} onChange={(event) => setVersion(event.target.value)} placeholder="1.1" className={FIELD_INPUT_CLASS} />
        </label>
        <label className="text-sm text-gray-700">
          Fuente técnica
          <input value={fuenteTecnica} onChange={(event) => setFuenteTecnica(event.target.value)} className={FIELD_INPUT_CLASS} />
        </label>
      </div>

      <ParametrosGrid parametros={editor.parametros} locked={false} onOffsetChange={editor.updateOffset} onMargenChange={editor.updateMargen} />

      <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Creando..." : "Crear modelo"}
      </button>
    </form>
  );
}
