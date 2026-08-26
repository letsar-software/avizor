"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { API_KEY_SCOPES } from "@/lib/empresas/spec";
import type { ApiKeyScope } from "@/types";

export default function ApiKeyForm({ empresaId }: { empresaId: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>([]);
  const [limiteMensual, setLimiteMensual] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claveCreada, setClaveCreada] = useState<string | null>(null);

  function toggleScope(scope: ApiKeyScope) {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((value) => value !== scope) : [...prev, scope]));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setClaveCreada(null);
    try {
      const response = await fetch(`/api/admin/empresas/${empresaId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          scopes,
          limite_mensual: limiteMensual ? Number(limiteMensual) : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear la API key.");
      setClaveCreada(data.data.key as string);
      setNombre("");
      setScopes([]);
      setLimiteMensual("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la API key.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label className="text-sm text-gray-700">
          Nombre
          <input required value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Producción" className={`${FIELD_INPUT_CLASS} w-40`} />
        </label>
        <fieldset className="text-sm text-gray-700">
          <legend>Scopes</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {API_KEY_SCOPES.map((scope) => (
              <label key={scope} className="flex items-center gap-1.5 rounded border border-gray-300 px-2 py-1.5">
                <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                {scope}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm text-gray-700">
          Límite mensual (opcional)
          <input type="number" min={1} value={limiteMensual} onChange={(event) => setLimiteMensual(event.target.value)} className={`${FIELD_INPUT_CLASS} w-32`} />
        </label>
        <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {saving ? "Creando..." : "Crear API key"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {claveCreada && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-sm font-medium text-amber-800">Copiá esta key ahora — no se vuelve a mostrar.</p>
          <code className="block break-all rounded bg-white px-3 py-2 text-sm text-gray-800">{claveCreada}</code>
        </div>
      )}
    </div>
  );
}
