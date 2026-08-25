"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { PLAGA_ESTADOS_CATALOGO, TIPOS_REGLA } from "@/lib/rules/condition-spec";
import type { CatalogoPlaga } from "@/types";

export default function PlagaEditForm({ plaga }: { plaga: CatalogoPlaga }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(plaga.nombre);
  const [nombreCientifico, setNombreCientifico] = useState(plaga.nombre_cientifico ?? "");
  const [estadoCatalogo, setEstadoCatalogo] = useState(plaga.estado_catalogo);
  const [tipoRegla, setTipoRegla] = useState(plaga.tipo_regla);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      if (nombre !== plaga.nombre) payload.nombre = nombre;
      if (nombreCientifico !== (plaga.nombre_cientifico ?? "")) payload.nombre_cientifico = nombreCientifico;
      if (estadoCatalogo !== plaga.estado_catalogo) payload.estado_catalogo = estadoCatalogo;
      if (tipoRegla !== plaga.tipo_regla) payload.tipo_regla = tipoRegla;

      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const response = await fetch(`/api/admin/plagas/${plaga.id}`, {
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
      {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
      {message && <p className="text-sm text-avizor-green sm:col-span-3">{message}</p>}

      <label className="text-sm text-gray-700">
        Nombre
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Nombre científico
        <input value={nombreCientifico} onChange={(event) => setNombreCientifico(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Tipo de regla
        <select value={tipoRegla} onChange={(event) => setTipoRegla(event.target.value as typeof tipoRegla)} className={FIELD_INPUT_CLASS}>
          {TIPOS_REGLA.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Estado del catálogo
        <select value={estadoCatalogo} onChange={(event) => setEstadoCatalogo(event.target.value as typeof estadoCatalogo)} className={FIELD_INPUT_CLASS}>
          {PLAGA_ESTADOS_CATALOGO.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>

      <div className="flex items-end">
        <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
