"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { EMPRESA_ESTADOS } from "@/lib/empresas/spec";
import type { Empresa } from "@/types";

export default function EmpresaEditForm({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(empresa.nombre);
  const [contactoNombre, setContactoNombre] = useState(empresa.contacto_nombre ?? "");
  const [contactoEmail, setContactoEmail] = useState(empresa.contacto_email ?? "");
  const [estado, setEstado] = useState(empresa.estado);
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
      if (nombre !== empresa.nombre) payload.nombre = nombre;
      if (contactoNombre !== (empresa.contacto_nombre ?? "")) payload.contacto_nombre = contactoNombre;
      if (contactoEmail !== (empresa.contacto_email ?? "")) payload.contacto_email = contactoEmail;
      if (estado !== empresa.estado) payload.estado = estado;

      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const response = await fetch(`/api/admin/empresas/${empresa.id}`, {
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4">
      {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      {message && <p className="text-sm text-avizor-green sm:col-span-4">{message}</p>}

      <label className="text-sm text-gray-700">
        Nombre
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Contacto
        <input value={contactoNombre} onChange={(event) => setContactoNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Email de contacto
        <input type="email" value={contactoEmail} onChange={(event) => setContactoEmail(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Estado
        <select value={estado} onChange={(event) => setEstado(event.target.value as typeof estado)} className={FIELD_INPUT_CLASS}>
          {EMPRESA_ESTADOS.map((value) => <option key={value} value={value}>{value}</option>)}
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
