"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { REGLA_ESTADOS } from "@/lib/rules/condition-spec";
import { useModeloParametrosEditor } from "@/components/admin/fenologia/useModeloParametrosEditor";
import ParametrosGrid from "@/components/admin/fenologia/ParametrosGrid";
import type { ModeloFenologico } from "@/types";

export default function ModeloEditForm({ modelo }: { modelo: ModeloFenologico }) {
  const router = useRouter();
  const locked = modelo.estado === "vigente"; // RN-004: un modelo vigente no se edita in place.
  const [estado, setEstado] = useState(modelo.estado);
  const [validadoPor, setValidadoPor] = useState(modelo.validado_por ?? "");
  const [validadoEn, setValidadoEn] = useState(modelo.validado_en ? modelo.validado_en.slice(0, 16) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const editor = useModeloParametrosEditor(modelo.parametros);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      if (estado !== modelo.estado) payload.estado = estado;
      if (!locked) payload.parametros = editor.parametros;
      if (validadoPor && validadoPor !== (modelo.validado_por ?? "")) payload.validado_por = validadoPor;
      if (validadoEn) payload.validado_en = new Date(validadoEn).toISOString();

      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const response = await fetch(`/api/admin/fenologia/${modelo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos guardar los cambios.");
      setMessage("Cambios guardados.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {locked && (
        <p className="rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Este modelo está vigente: los parámetros no se pueden editar in place. Para cambiar coeficientes hay que crear una nueva versión.
        </p>
      )}
      {error && <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded bg-avizor-green-light px-4 py-3 text-sm text-avizor-green">{message}</p>}

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <label className="text-sm text-gray-700">
          Estado
          <select value={estado} onChange={(event) => setEstado(event.target.value as typeof estado)} className={FIELD_INPUT_CLASS}>
            {REGLA_ESTADOS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Validado por
          <input value={validadoPor} onChange={(event) => setValidadoPor(event.target.value)} placeholder="Nombre de quien valida" className={FIELD_INPUT_CLASS} />
        </label>
        <label className="text-sm text-gray-700">
          Validado en
          <input type="datetime-local" value={validadoEn} onChange={(event) => setValidadoEn(event.target.value)} className={FIELD_INPUT_CLASS} />
        </label>
      </div>

      <ParametrosGrid parametros={editor.parametros} locked={locked} onOffsetChange={editor.updateOffset} onMargenChange={editor.updateMargen} />

      <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
