"use client";
import { useMemo, useState } from "react";
import type { CatalogEntry } from "@/lib/variables/catalog";
import { VARIABLE_ORIGINS, VARIABLE_VALUE_TYPES, providerCoverage } from "@/lib/variables/catalog";
import { validateVariableLists } from "@/lib/variables/lists";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";

type ListName = "critical" | "complementary";

const HELP: Record<ListName, { title: string; text: string }> = {
  critical: { title: "Variables críticas", text: "Sin estos datos no se puede confirmar el resultado de la regla." },
  complementary: { title: "Variables complementarias", text: "Mejoran el monitoreo y las recomendaciones, pero no bloquean el cálculo." },
};

const COVERAGE_WARNING: Record<string, string> = {
  no_disponible: "El proveedor climático configurado no entrega esta variable: la regla quedará sin confirmar hasta que exista un sensor, modelo o dato de campo.",
  dato_de_campo: "Depende de un dato cargado en el lote: sin ese dato la regla no confirma resultado.",
  desconocida: "La variable no está en el catálogo.",
};

/** Listas críticas y complementarias de una regla; el orden se conserva al guardar. */
export default function RuleVariablesEditor({
  critical,
  complementary,
  onChange,
  catalog,
  onCatalogChange,
  locked,
  legacy,
  canCreate,
}: {
  critical: string[];
  complementary: string[];
  onChange: (lists: { critical: string[]; complementary: string[] }) => void;
  catalog: CatalogEntry[];
  onCatalogChange: (catalog: CatalogEntry[]) => void;
  locked: boolean;
  legacy: boolean;
  canCreate: boolean;
}) {
  const byKey = useMemo(() => new Map(catalog.map((entry) => [entry.clave, entry])), [catalog]);
  const issues = validateVariableLists(critical, complementary, new Set(catalog.map((entry) => entry.clave)));
  const lists = { critical, complementary };

  function update(name: ListName, next: string[]) {
    onChange({ ...lists, [name]: next });
  }
  function move(name: ListName, index: number, delta: -1 | 1) {
    const next = [...lists[name]];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(name, next);
  }

  return (
    <section className="rounded-lg border bg-white p-4" aria-labelledby="rule-variables-title">
      <h2 id="rule-variables-title" className="text-base font-semibold text-avizor-navy">Variables de la regla</h2>
      {legacy ? (
        <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Regla histórica: sus variables requeridas se tratan como críticas hasta que se guarden estas listas.
        </p>
      ) : null}
      {locked ? <p className="mt-2 text-sm text-gray-500">Regla vigente: para cambiar sus variables hay que crear una nueva versión.</p> : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {(["critical", "complementary"] as const).map((name) => (
          <VariableList
            key={name}
            name={name}
            values={lists[name]}
            other={lists[name === "critical" ? "complementary" : "critical"]}
            byKey={byKey}
            catalog={catalog}
            locked={locked}
            onAdd={(key) => update(name, [...lists[name], key])}
            onRemove={(index) => update(name, lists[name].filter((_, position) => position !== index))}
            onMove={(index, delta) => move(name, index, delta)}
          />
        ))}
      </div>
      {issues.length ? (
        <ul className="mt-3 space-y-1 text-sm text-red-600" role="alert">
          {issues.map((issue) => <li key={`${issue.list}-${issue.variable}-${issue.message}`}>{issue.message}</li>)}
        </ul>
      ) : null}
      {canCreate && !locked ? <CreateVariable onCreated={(entry) => onCatalogChange([...catalog, entry])} /> : null}
    </section>
  );
}

function VariableList({
  name, values, other, byKey, catalog, locked, onAdd, onRemove, onMove,
}: {
  name: ListName;
  values: string[];
  other: string[];
  byKey: Map<string, CatalogEntry>;
  catalog: CatalogEntry[];
  locked: boolean;
  onAdd: (key: string) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, delta: -1 | 1) => void;
}) {
  const [selected, setSelected] = useState("");
  const options = catalog.filter((entry) => entry.activa && !values.includes(entry.clave) && !other.includes(entry.clave));
  return (
    <div>
      <h3 className="text-sm font-semibold">{HELP[name].title}</h3>
      <p className="text-xs text-gray-500">{HELP[name].text}</p>
      <ol className="mt-2 space-y-2">
        {values.length ? values.map((key, index) => {
          const entry = byKey.get(key);
          const warning = name === "critical" ? COVERAGE_WARNING[entry?.cobertura_proveedor ?? "desconocida"] : undefined;
          return (
            <li key={key} className="rounded border px-3 py-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{entry?.etiqueta ?? key}</span>
                  <code className="text-xs text-gray-500">{key}{entry?.unidad ? ` · ${entry.unidad}` : ""}</code>
                  {entry?.descripcion ? <span className="block text-xs text-gray-500">{entry.descripcion}</span> : null}
                  {entry?.uso.length ? (
                    <span className="block text-xs text-gray-500">
                      Usada en: {[...new Set(entry.uso.map((use) => `${use.clave} (${use.cultivo})`))].join(", ")}
                    </span>
                  ) : null}
                </span>
                {!locked ? (
                  <span className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Subir ${key}`} className="rounded border px-1.5 disabled:opacity-40">↑</button>
                    <button type="button" onClick={() => onMove(index, 1)} disabled={index === values.length - 1} aria-label={`Bajar ${key}`} className="rounded border px-1.5 disabled:opacity-40">↓</button>
                    <button type="button" onClick={() => onRemove(index)} aria-label={`Quitar ${key}`} className="rounded border px-1.5 text-red-600">✕</button>
                  </span>
                ) : null}
              </div>
              {warning ? <p className="mt-1 text-xs text-amber-700">{warning}</p> : null}
            </li>
          );
        }) : <li className="text-sm text-gray-400">Sin variables.</li>}
      </ol>
      {!locked ? (
        <div className="mt-2 flex gap-2">
          <label className="sr-only" htmlFor={`add-${name}`}>Agregar variable {HELP[name].title.toLowerCase()}</label>
          <select id={`add-${name}`} value={selected} onChange={(event) => setSelected(event.target.value)} className={FIELD_INPUT_CLASS}>
            <option value="">Elegir del catálogo…</option>
            {options.map((entry) => <option key={entry.clave} value={entry.clave}>{entry.etiqueta} ({entry.clave})</option>)}
          </select>
          <button type="button" disabled={!selected} onClick={() => { onAdd(selected); setSelected(""); }} className="mt-1 shrink-0 rounded border border-avizor-green px-3 text-sm text-avizor-green disabled:opacity-40">
            Agregar
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CreateVariable({ onCreated }: { onCreated: (entry: CatalogEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit() {
    const form = document.getElementById("create-variable-fields");
    if (!form) return;
    const value = (name: string) => (form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | null)?.value.trim() ?? "";
    setSaving(true);
    setError(null);
    try {
      const vigencia = value("vigencia_dias");
      const response = await fetch("/api/admin/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave: value("clave"), etiqueta: value("etiqueta"), descripcion: value("descripcion") || undefined,
          unidad: value("unidad") || null, tipo_valor: value("tipo_valor"), origen: value("origen"),
          proveedores: value("proveedores") ? value("proveedores").split(",").map((item) => item.trim()).filter(Boolean) : [],
          vigencia_dias: vigencia ? Number(vigencia) : null,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "No pudimos crear la variable.");
      onCreated({ ...body.data, cobertura_proveedor: providerCoverage(body.data), uso: [] });
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos crear la variable.");
    } finally {
      setSaving(false);
    }
  }
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-4 text-sm text-avizor-green hover:underline">+ Crear variable nueva en el catálogo</button>;
  }
  // Campos dentro del formulario de la regla: se envían con fetch propio, no con el submit de la regla.
  return (
    <div id="create-variable-fields" className="mt-4 grid gap-2 rounded border bg-gray-50 p-3 md:grid-cols-3">
      <label className="text-xs">Clave técnica<input name="clave" required pattern="[a-z][a-z0-9_]{1,62}" placeholder="humedad_hoja_sensor" className={FIELD_INPUT_CLASS} /></label>
      <label className="text-xs md:col-span-2">Etiqueta visible<input name="etiqueta" required className={FIELD_INPUT_CLASS} /></label>
      <label className="text-xs md:col-span-3">Descripción<input name="descripcion" className={FIELD_INPUT_CLASS} /></label>
      <label className="text-xs">Unidad<input name="unidad" className={FIELD_INPUT_CLASS} /></label>
      <label className="text-xs">Tipo de valor<select name="tipo_valor" className={FIELD_INPUT_CLASS}>{VARIABLE_VALUE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="text-xs">Origen<select name="origen" className={FIELD_INPUT_CLASS}>{VARIABLE_ORIGINS.map((origin) => <option key={origin}>{origin}</option>)}</select></label>
      <label className="text-xs md:col-span-2">Proveedores (separados por coma)<input name="proveedores" placeholder="open_meteo" className={FIELD_INPUT_CLASS} /></label>
      <label className="text-xs">Vigencia (días)<input name="vigencia_dias" type="number" min="1" className={FIELD_INPUT_CLASS} /></label>
      {error ? <p className="text-sm text-red-600 md:col-span-3">{error}</p> : null}
      <div className="flex gap-2 md:col-span-3">
        <button type="button" disabled={saving} onClick={submit} className="rounded bg-avizor-green px-3 py-1.5 text-sm text-white disabled:opacity-60">{saving ? "Creando…" : "Crear variable"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1.5 text-sm">Cancelar</button>
      </div>
    </div>
  );
}
