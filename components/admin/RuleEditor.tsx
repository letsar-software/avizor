"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/lib/admin/auth";
import type { AggregatorKey, CondicionDefinicion, NivelRegla, ReglaAgronomicaV2, SpecOperator, SpecVariable } from "@/types";
import { hasAccess } from "@/lib/admin/permissions";

const VARIABLES: SpecVariable[] = [
  "humedad_relativa", "precipitacion", "temperatura_media", "temperatura_min", "temperatura_max",
  "viento_medio", "punto_rocio", "deficit_presion_vapor", "evapotranspiracion", "et0_fao_56",
  "humedad_suelo_0_1cm", "humedad_suelo_1_3cm", "humedad_suelo_3_9cm", "humedad_suelo_9_27cm", "humedad_suelo_27_81cm",
  "temperatura_suelo_0cm", "temperatura_suelo_6cm", "temperatura_suelo_18cm", "temperatura_suelo_54cm",
  "radiacion_solar",
];
const AGGREGATORS: AggregatorKey[] = ["media_ventana", "min_ventana", "suma_ventana", "dias_con_condicion"];
const OPERATORS: SpecOperator[] = ["gt", "gte", "lt", "lte", "eq", "between"];
const ESTADOS = ["experimental", "revisada", "vigente", "retirada"] as const;

const inputClass = "mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-avizor-green focus:outline-none";

export default function RuleEditor({ regla, rol }: { regla: ReglaAgronomicaV2; rol: AdminRole }) {
  const router = useRouter();
  const locked = regla.estado === "vigente"; // RN-004: una vigente no se edita in place.
  const puedePromover = hasAccess(rol, "reglas_promover", "write");

  const [estado, setEstado] = useState<ReglaAgronomicaV2["estado"]>(regla.estado);
  const [niveles, setNiveles] = useState<NivelRegla[]>(regla.definicion.niveles);
  const [validadoPor, setValidadoPor] = useState(regla.validado_por ?? "");
  const [validadoEn, setValidadoEn] = useState(regla.validado_en ? regla.validado_en.slice(0, 16) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const estadoOptions = ESTADOS.filter((value) => value !== "vigente" || puedePromover);

  function updateNivelField<K extends keyof NivelRegla>(index: number, field: K, value: NivelRegla[K]) {
    setNiveles((prev) => prev.map((nivel, i) => (i !== index ? nivel : { ...nivel, [field]: value })));
  }

  function updateCondicion(nivelIndex: number, condIndex: number, updater: (condicion: CondicionDefinicion) => CondicionDefinicion) {
    setNiveles((prev) => prev.map((nivel, ni) => (ni !== nivelIndex ? nivel : { ...nivel, condiciones: nivel.condiciones.map((c, ci) => (ci !== condIndex ? c : updater(c))) })));
  }

  function handleOperadorChange(nivelIndex: number, condIndex: number, operador: SpecOperator) {
    updateCondicion(nivelIndex, condIndex, (c) => {
      const primero = Array.isArray(c.valor) ? c.valor[0] : c.valor;
      return { ...c, operador, valor: operador === "between" ? [primero, primero] : primero };
    });
  }

  function handleAgregadorChange(nivelIndex: number, condIndex: number, agregador: AggregatorKey) {
    updateCondicion(nivelIndex, condIndex, (c) => {
      const next = { ...c, agregador };
      if (agregador === "dias_con_condicion") next.subcondicion = c.subcondicion ?? { operador: "gte", valor: 0, unidad: c.unidad };
      else delete next.subcondicion;
      return next;
    });
  }

  function addCondicion(nivelIndex: number) {
    setNiveles((prev) => prev.map((nivel, ni) => (ni !== nivelIndex ? nivel : {
      ...nivel,
      condiciones: [...nivel.condiciones, { variable: "temperatura_media", agregador: "media_ventana", operador: "gte", valor: 0, unidad: "C" } as CondicionDefinicion],
    })));
  }

  function removeCondicion(nivelIndex: number, condIndex: number) {
    setNiveles((prev) => prev.map((nivel, ni) => (ni !== nivelIndex ? nivel : { ...nivel, condiciones: nivel.condiciones.filter((_, ci) => ci !== condIndex) })));
  }

  function addNivel() {
    setNiveles((prev) => [...prev, { orden: prev.length + 1, clave: `nivel_${prev.length + 1}`, orden_visual: prev.length + 1, etiqueta: "Nuevo nivel", explicacion: "", recomendacion: "", condiciones: [] }]);
  }

  function removeNivel(index: number) {
    setNiveles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      if (estado !== regla.estado) payload.estado = estado;
      if (!locked) payload.definicion = { niveles, sin_coincidencia: regla.definicion.sin_coincidencia };
      if (validadoPor && validadoPor !== (regla.validado_por ?? "")) payload.validado_por = validadoPor;
      if (validadoEn) payload.validado_en = new Date(validadoEn).toISOString();

      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const response = await fetch(`/api/admin/reglas/${regla.id}`, {
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
    <form onSubmit={handleSave} className="space-y-6">
      {locked && (
        <p className="rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Esta regla está vigente: la definición no se puede editar in place. Para cambiar umbrales hay que crear una nueva versión.
        </p>
      )}
      {error && <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded bg-avizor-green-light px-4 py-3 text-sm text-avizor-green">{message}</p>}

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <label className="text-sm text-gray-700">
          Estado
          <select value={estado} onChange={(event) => setEstado(event.target.value as ReglaAgronomicaV2["estado"])} className={inputClass}>
            {estadoOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Validado por
          <input value={validadoPor} onChange={(event) => setValidadoPor(event.target.value)} placeholder="Nombre de quien valida" className={inputClass} />
        </label>
        <label className="text-sm text-gray-700">
          Validado en
          <input type="datetime-local" value={validadoEn} onChange={(event) => setValidadoEn(event.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="space-y-4">
        {niveles.map((nivel, nivelIndex) => (
          <div key={nivelIndex} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-sm text-gray-700">
                  Clave
                  <input disabled={locked} value={nivel.clave} onChange={(event) => updateNivelField(nivelIndex, "clave", event.target.value)} className={inputClass} />
                </label>
                <label className="text-sm text-gray-700 sm:col-span-2">
                  Etiqueta
                  <input disabled={locked} value={nivel.etiqueta} onChange={(event) => updateNivelField(nivelIndex, "etiqueta", event.target.value)} className={inputClass} />
                </label>
                <label className="text-sm text-gray-700 sm:col-span-3">
                  Explicación
                  <input disabled={locked} value={nivel.explicacion ?? ""} onChange={(event) => updateNivelField(nivelIndex, "explicacion", event.target.value)} className={inputClass} />
                </label>
                <label className="text-sm text-gray-700 sm:col-span-3">
                  Recomendación
                  <input disabled={locked} value={nivel.recomendacion ?? ""} onChange={(event) => updateNivelField(nivelIndex, "recomendacion", event.target.value)} className={inputClass} />
                </label>
              </div>
              {!locked && (
                <button type="button" onClick={() => removeNivel(nivelIndex)} className="shrink-0 text-xs text-red-500 hover:underline">
                  Eliminar nivel
                </button>
              )}
            </div>

            <div className="space-y-2">
              {nivel.condiciones.map((condicion, condIndex) => (
                <div key={condIndex} className="grid grid-cols-2 gap-2 rounded border border-gray-100 bg-gray-50 p-3 sm:grid-cols-6">
                  <label className="text-xs text-gray-600">
                    Variable
                    <select disabled={locked} value={condicion.variable} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, variable: event.target.value as SpecVariable }))} className={inputClass}>
                      {VARIABLES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-gray-600">
                    Agregador
                    <select disabled={locked} value={condicion.agregador} onChange={(event) => handleAgregadorChange(nivelIndex, condIndex, event.target.value as AggregatorKey)} className={inputClass}>
                      {AGGREGATORS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-gray-600">
                    Operador
                    <select disabled={locked} value={condicion.operador} onChange={(event) => handleOperadorChange(nivelIndex, condIndex, event.target.value as SpecOperator)} className={inputClass}>
                      {OPERATORS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  {condicion.operador === "between" ? (
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <label className="text-xs text-gray-600">
                        Desde
                        <input disabled={locked} type="number" value={(condicion.valor as [number, number])[0]} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, valor: [Number(event.target.value), (c.valor as [number, number])[1]] }))} className={inputClass} />
                      </label>
                      <label className="text-xs text-gray-600">
                        Hasta
                        <input disabled={locked} type="number" value={(condicion.valor as [number, number])[1]} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, valor: [(c.valor as [number, number])[0], Number(event.target.value)] }))} className={inputClass} />
                      </label>
                    </div>
                  ) : (
                    <label className="text-xs text-gray-600">
                      Valor
                      <input disabled={locked} type="number" value={condicion.valor as number} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, valor: Number(event.target.value) }))} className={inputClass} />
                    </label>
                  )}
                  <label className="text-xs text-gray-600">
                    Unidad
                    <input disabled={locked} value={condicion.unidad} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, unidad: event.target.value }))} className={inputClass} />
                  </label>

                  {condicion.agregador === "dias_con_condicion" && condicion.subcondicion && (
                    <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-6">
                      <label className="text-xs text-gray-600">
                        Subcondición · operador
                        <select disabled={locked} value={condicion.subcondicion.operador} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, subcondicion: { ...c.subcondicion!, operador: event.target.value as SpecOperator } }))} className={inputClass}>
                          {OPERATORS.filter((op) => op !== "between").map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-gray-600">
                        Subcondición · valor
                        <input disabled={locked} type="number" value={condicion.subcondicion.valor} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, subcondicion: { ...c.subcondicion!, valor: Number(event.target.value) } }))} className={inputClass} />
                      </label>
                      <label className="text-xs text-gray-600">
                        Subcondición · unidad
                        <input disabled={locked} value={condicion.subcondicion.unidad} onChange={(event) => updateCondicion(nivelIndex, condIndex, (c) => ({ ...c, subcondicion: { ...c.subcondicion!, unidad: event.target.value } }))} className={inputClass} />
                      </label>
                    </div>
                  )}

                  {!locked && (
                    <button type="button" onClick={() => removeCondicion(nivelIndex, condIndex)} className="col-span-2 text-xs text-red-500 hover:underline sm:col-span-1">
                      Eliminar condición
                    </button>
                  )}
                </div>
              ))}
              {!locked && (
                <button type="button" onClick={() => addCondicion(nivelIndex)} className="text-xs text-avizor-green hover:underline">
                  + Agregar condición
                </button>
              )}
            </div>
          </div>
        ))}
        {!locked && (
          <button type="button" onClick={addNivel} className="text-sm text-avizor-green hover:underline">
            + Agregar nivel
          </button>
        )}
      </div>

      <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
