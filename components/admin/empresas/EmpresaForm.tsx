"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";

export default function EmpresaForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, contacto_nombre: contactoNombre || undefined, contacto_email: contactoEmail || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear la empresa.");
      setNombre("");
      setContactoNombre("");
      setContactoEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la empresa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
      <label className="text-sm text-gray-700">
        Nombre
        <input required value={nombre} onChange={(event) => setNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Contacto
        <input value={contactoNombre} onChange={(event) => setContactoNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Email de contacto
        <input type="email" value={contactoEmail} onChange={(event) => setContactoEmail(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <div className="flex items-end sm:col-span-3">
        <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {saving ? "Creando..." : "Agregar empresa"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
    </form>
  );
}
