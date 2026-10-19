"use client";
import { useMemo, useState, type FormEvent } from "react";
import type { AgronomicVariable } from "@/lib/variables/catalog";
import { FIELD_DATA_SOURCES } from "@/lib/variables/catalog";
import { expiresAt, isCurrent, type FieldDatum } from "@/lib/field-data/current";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { localDateTimeInputValue } from "@/lib/admin/datetime";
import type { Lot } from "@/lib/lots/access";

const SOURCE_LABEL: Record<string, string> = { manual: "Manual", sensor: "Sensor", import: "Importación", calculated: "Calculado" };

function parseValue(raw: string, variable: AgronomicVariable | undefined) {
  if (variable?.tipo_valor === "numero") return Number(raw.replace(",", "."));
  if (variable?.tipo_valor === "booleano") return raw === "si";
  return raw.trim();
}

function formatDate(value: string | Date | null) {
  if (!value) return "No vence";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function FieldDataManager({ variables, initial, lots: initialLots, canWrite }: { variables: AgronomicVariable[]; initial: FieldDatum[]; lots: Lot[]; canWrite: boolean }) {
  const [items, setItems] = useState(initial);
  const [lots, setLots] = useState(initialLots);
  const lotName = useMemo(() => new Map(lots.map((lot) => [lot.id, lot.nombre])), [lots]);
  const [filter, setFilter] = useState("");
  const [variableKey, setVariableKey] = useState(variables[0]?.clave ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const byKey = useMemo(() => new Map(variables.map((variable) => [variable.clave, variable])), [variables]);
  const selected = byKey.get(variableKey);
  const now = new Date();
  const visible = items.filter((item) => !filter || item.field_id.includes(filter.trim()));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      const validUntil = String(data.get("valid_until") || "");
      const response = await fetch("/api/admin/datos-campo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: String(data.get("field_id")),
          variable_key: variableKey,
          value: parseValue(String(data.get("value") ?? ""), selected),
          observed_at: new Date(String(data.get("observed_at"))).toISOString(),
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          source: String(data.get("source")),
          notes: String(data.get("notes") || "") || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "No pudimos guardar el dato.");
      setItems((current) => [body.data, ...current]);
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos guardar el dato.");
    } finally {
      setSaving(false);
    }
  }

  async function markHistoric(id: string) {
    setError(null);
    const response = await fetch(`/api/admin/datos-campo/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "historico" }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body?.error?.message ?? "No pudimos actualizar el dato."); return; }
    setItems((current) => current.map((item) => (item.id === id ? body.data : item)));
  }

  return (
    <div className="space-y-6">
      {canWrite ? (
        <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3">
          <label className="text-sm">Lote
            <select required name="field_id" className={FIELD_INPUT_CLASS}>
              <option value="">Elegir lote…</option>
              {lots.filter((lot) => lot.activo).map((lot) => <option key={lot.id} value={lot.id}>{lot.nombre}</option>)}
            </select>
          </label>
          <label className="text-sm md:col-span-2">Variable
            <select value={variableKey} onChange={(event) => setVariableKey(event.target.value)} className={FIELD_INPUT_CLASS}>
              {variables.map((variable) => <option key={variable.clave} value={variable.clave}>{variable.etiqueta} ({variable.clave})</option>)}
            </select>
          </label>
          <label className="text-sm">Valor{selected?.unidad ? ` (${selected.unidad})` : ""}
            {selected?.tipo_valor === "booleano"
              ? <select name="value" className={FIELD_INPUT_CLASS}><option value="si">Sí</option><option value="no">No</option></select>
              : <input required name="value" type={selected?.tipo_valor === "numero" ? "number" : selected?.tipo_valor === "fecha" ? "date" : "text"} step="any" className={FIELD_INPUT_CLASS} />}
          </label>
          <label className="text-sm">Observado el<input required name="observed_at" type="datetime-local" defaultValue={localDateTimeInputValue(now)} className={FIELD_INPUT_CLASS} /></label>
          <label className="text-sm">Vence el (opcional)<input name="valid_until" type="datetime-local" className={FIELD_INPUT_CLASS} /></label>
          <label className="text-sm">Origen
            <select name="source" className={FIELD_INPUT_CLASS}>{FIELD_DATA_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABEL[source]}</option>)}</select>
          </label>
          <label className="text-sm md:col-span-2">Notas<input name="notes" maxLength={2000} className={FIELD_INPUT_CLASS} /></label>
          {selected?.vigencia_dias ? <p className="text-xs text-gray-500 md:col-span-3">Sin vencimiento explícito, el dato se usa durante {selected.vigencia_dias} días.</p> : null}
          {error ? <p className="text-sm text-red-600 md:col-span-3">{error}</p> : null}
          <button disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm text-white disabled:opacity-60 md:col-span-3">{saving ? "Guardando…" : "Guardar dato de campo"}</button>
        </form>
      ) : null}
      {canWrite ? <CreateLot onCreated={(lot) => setLots((current) => [lot, ...current])} /> : null}
      <div>
        <label className="text-sm">Filtrar por lote (id)<input value={filter} onChange={(event) => setFilter(event.target.value)} className={`${FIELD_INPUT_CLASS} max-w-sm`} /></label>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-gray-500"><th className="p-3">Lote</th><th className="p-3">Variable</th><th className="p-3">Valor</th><th className="p-3">Observado</th><th className="p-3">Vence</th><th className="p-3">Estado</th><th className="p-3">Cargó</th><th className="p-3" /></tr></thead>
          <tbody>
            {visible.length ? visible.map((item) => {
              const variable = byKey.get(item.variable_key);
              const current = isCurrent(item, now, variable?.vigencia_dias);
              const state = item.status === "historico" ? "Histórico" : current ? "Vigente" : "Vencido";
              return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">{lotName.get(item.field_id) ?? item.field_id}</td>
                  <td className="p-3">{variable?.etiqueta ?? item.variable_key}</td>
                  <td className="p-3">{String(item.value)}{item.unit ? ` ${item.unit}` : ""}</td>
                  <td className="p-3">{formatDate(item.observed_at)}</td>
                  <td className="p-3">{formatDate(expiresAt(item, variable?.vigencia_dias))}</td>
                  <td className="p-3">{state}</td>
                  <td className="p-3 text-xs">{item.recorded_by ?? "—"} · {SOURCE_LABEL[item.source] ?? item.source}</td>
                  <td className="p-3">{canWrite && item.status === "vigente" && item.id ? <button type="button" onClick={() => markHistoric(item.id!)} className="text-xs text-avizor-green hover:underline">Marcar histórico</button> : null}</td>
                </tr>
              );
            }) : <tr><td colSpan={8} className="p-3 text-gray-400">Sin datos cargados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateLot({ onCreated }: { onCreated: (lot: Lot) => void }) {
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    const response = await fetch("/api/admin/lotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: String(data.get("nombre")).trim(),
        empresa_id: String(data.get("empresa_id") || "").trim() || null,
        cultivo: String(data.get("cultivo") || "").trim() || null,
      }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body?.error?.message ?? "No pudimos crear el lote."); return; }
    onCreated(body.data);
    form.reset();
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4" aria-label="Crear lote">
      <label className="text-sm">Nombre del lote<input required name="nombre" maxLength={160} className={FIELD_INPUT_CLASS} /></label>
      <label className="text-sm">Empresa (id, opcional)<input name="empresa_id" className={FIELD_INPUT_CLASS} /></label>
      <label className="text-sm">Cultivo (opcional)<input name="cultivo" maxLength={40} className={FIELD_INPUT_CLASS} /></label>
      <button className="mt-6 rounded border border-avizor-green px-4 py-1.5 text-sm text-avizor-green">Crear lote</button>
      {error ? <p className="text-sm text-red-600 md:col-span-4">{error}</p> : null}
    </form>
  );
}
