"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";

export default function CultivoForm() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/cultivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, nombre, activo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear el cultivo.");
      setClave("");
      setNombre("");
      setActivo(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear el cultivo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <label className="text-sm text-gray-700">
        Clave
        <input required value={clave} onChange={(event) => setClave(event.target.value)} placeholder="maiz" className={`${FIELD_INPUT_CLASS} w-40`} />
      </label>
      <label className="text-sm text-gray-700">
        Nombre
        <input required value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Maíz" className={`${FIELD_INPUT_CLASS} w-48`} />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
        <input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} />
        Activo
      </label>
      <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Creando..." : "Agregar cultivo"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
