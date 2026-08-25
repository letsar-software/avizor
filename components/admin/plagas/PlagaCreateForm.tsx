"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { TIPOS_REGLA } from "@/lib/rules/condition-spec";

export default function PlagaCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({ cultivo: "soja", grupo_plaga: "", especie: "", nombre: "", nombre_cientifico: "", tipo_regla: TIPOS_REGLA[0], version: "1.0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/plagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, especie: form.especie || undefined, nombre_cientifico: form.nombre_cientifico || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear la plaga.");
      setForm((prev) => ({ ...prev, grupo_plaga: "", especie: "", nombre: "", nombre_cientifico: "" }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la plaga.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
      <label className="text-sm text-gray-700">
        Cultivo
        <input required value={form.cultivo} onChange={(event) => setField("cultivo", event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Grupo de plaga
        <input required value={form.grupo_plaga} onChange={(event) => setField("grupo_plaga", event.target.value)} placeholder="trips" className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Especie (opcional)
        <input value={form.especie} onChange={(event) => setField("especie", event.target.value)} placeholder="caliothrips_phaseoli" className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Nombre
        <input required value={form.nombre} onChange={(event) => setField("nombre", event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Nombre científico
        <input value={form.nombre_cientifico} onChange={(event) => setField("nombre_cientifico", event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Tipo de regla
        <select value={form.tipo_regla} onChange={(event) => setField("tipo_regla", event.target.value as typeof form.tipo_regla)} className={FIELD_INPUT_CLASS}>
          {TIPOS_REGLA.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Versión
        <input required value={form.version} onChange={(event) => setField("version", event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <div className="flex items-end sm:col-span-3">
        <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {saving ? "Creando..." : "Agregar plaga al catálogo"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
    </form>
  );
}
