"use client";
import { useState, type FormEvent } from "react";
import type { AgronomicAdvisory, RiskCategory } from "@/types";
import { localDateTimeInputValue } from "@/lib/admin/datetime";

export default function AdvisoryManager({ categories, initial }: { categories: RiskCategory[]; initial: AgronomicAdvisory[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null);
    const data = new FormData(event.currentTarget);
    const scopeType = String(data.get("scope_type"));
    const payload = {
      crop_id: String(data.get("crop_id") || "") || null, category_id: String(data.get("category_id")), scope_type: scopeType,
      scope_id: scopeType === "global" ? null : String(data.get("scope_id")), status: String(data.get("status")), title: String(data.get("title")),
      message: String(data.get("message")), recommended_action: String(data.get("recommended_action")), starts_at: new Date(String(data.get("starts_at"))).toISOString(),
      ends_at: data.get("ends_at") ? new Date(String(data.get("ends_at"))).toISOString() : null, active: true, priority: Number(data.get("priority") || 0),
      source_type: String(data.get("source_type")), source_name: String(data.get("source_name")), source_url: String(data.get("source_url") || "") || null,
      validated_by: String(data.get("validated_by")), reviewed_at: new Date(String(data.get("reviewed_at"))).toISOString(), notes: String(data.get("notes") || "") || undefined,
    };
    try {
      const response = await fetch("/api/admin/advisories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "No pudimos guardar la validación.");
      setItems((current) => [body.data, ...current]); event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos guardar la validación."); }
    finally { setSaving(false); }
  }
  const now = localDateTimeInputValue();
  return <div className="space-y-6">
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
      <select required name="category_id" className="rounded border p-2"><option value="">Categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <input name="crop_id" placeholder="Cultivo (vacío = todos)" className="rounded border p-2" />
      <select name="status" className="rounded border p-2"><option value="informativo">Informativo</option><option value="vigilancia">Vigilancia</option><option value="moderado">Moderado</option><option value="alto">Alto</option><option value="critico">Crítico</option></select>
      <input required name="title" placeholder="Título" className="rounded border p-2" />
      <textarea required name="message" placeholder="Mensaje" className="rounded border p-2 md:col-span-2" />
      <textarea required name="recommended_action" placeholder="Acción recomendada" className="rounded border p-2 md:col-span-2" />
      <select name="scope_type" className="rounded border p-2"><option value="global">Global</option><option value="region">Región</option><option value="farm">Establecimiento</option><option value="field">Lote</option></select>
      <input name="scope_id" placeholder="ID del alcance (si corresponde)" className="rounded border p-2" />
      <input required name="starts_at" type="datetime-local" defaultValue={now} className="rounded border p-2" />
      <input name="ends_at" type="datetime-local" className="rounded border p-2" />
      <input name="priority" type="number" defaultValue="0" className="rounded border p-2" />
      <select name="source_type" className="rounded border p-2"><option value="agronomic_validation">Validación agronómica</option><option value="official_alert">Alerta oficial</option><option value="field_observation">Observación de lote</option><option value="technical_report">Informe técnico</option></select>
      <input required name="source_name" placeholder="Fuente" className="rounded border p-2" />
      <input name="source_url" type="url" placeholder="URL de fuente" className="rounded border p-2" />
      <input required name="validated_by" placeholder="Responsable técnico" className="rounded border p-2" />
      <input required name="reviewed_at" type="datetime-local" defaultValue={now} className="rounded border p-2" />
      <input name="notes" placeholder="Notas" className="rounded border p-2 md:col-span-2" />
      {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
      <button disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-white disabled:opacity-60 md:col-span-2">{saving ? "Guardando…" : "Publicar validación técnica"}</button>
    </form>
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-3">Estado</th><th className="p-3">Título</th><th className="p-3">Alcance</th><th className="p-3">Vigencia</th><th className="p-3">Revisión</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b"><td className="p-3">{item.status}</td><td className="p-3">{item.title}</td><td className="p-3">{item.scope_type}</td><td className="p-3">{item.starts_at.slice(0, 10)}{item.ends_at ? ` – ${item.ends_at.slice(0, 10)}` : ""}</td><td className="p-3">{item.validated_by}</td></tr>)}</tbody></table></div>
  </div>;
}
