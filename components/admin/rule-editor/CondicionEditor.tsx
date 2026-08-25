"use client";
import type { AggregatorKey, CondicionDefinicion, SpecOperator, SpecVariable } from "@/types";
import { SPEC_AGGREGATORS, SPEC_OPERATORS, SPEC_VARIABLES } from "@/lib/rules/condition-spec";
import { FIELD_INPUT_CLASS } from "@/components/admin/rule-editor/styles";

interface CondicionEditorProps {
  condicion: CondicionDefinicion;
  locked: boolean;
  onChange: (updater: (condicion: CondicionDefinicion) => CondicionDefinicion) => void;
  onOperadorChange: (operador: SpecOperator) => void;
  onAgregadorChange: (agregador: AggregatorKey) => void;
  onRemove: () => void;
}

export default function CondicionEditor({ condicion, locked, onChange, onOperadorChange, onAgregadorChange, onRemove }: CondicionEditorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded border border-gray-100 bg-gray-50 p-3 sm:grid-cols-6">
      <label className="text-xs text-gray-600">
        Variable
        <select disabled={locked} value={condicion.variable} onChange={(event) => onChange((c) => ({ ...c, variable: event.target.value as SpecVariable }))} className={FIELD_INPUT_CLASS}>
          {SPEC_VARIABLES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-600">
        Agregador
        <select disabled={locked} value={condicion.agregador} onChange={(event) => onAgregadorChange(event.target.value as AggregatorKey)} className={FIELD_INPUT_CLASS}>
          {SPEC_AGGREGATORS.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-600">
        Operador
        <select disabled={locked} value={condicion.operador} onChange={(event) => onOperadorChange(event.target.value as SpecOperator)} className={FIELD_INPUT_CLASS}>
          {SPEC_OPERATORS.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>

      {condicion.operador === "between" ? (
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">
            Desde
            <input
              disabled={locked}
              type="number"
              value={(condicion.valor as [number, number])[0]}
              onChange={(event) => onChange((c) => ({ ...c, valor: [Number(event.target.value), (c.valor as [number, number])[1]] }))}
              className={FIELD_INPUT_CLASS}
            />
          </label>
          <label className="text-xs text-gray-600">
            Hasta
            <input
              disabled={locked}
              type="number"
              value={(condicion.valor as [number, number])[1]}
              onChange={(event) => onChange((c) => ({ ...c, valor: [(c.valor as [number, number])[0], Number(event.target.value)] }))}
              className={FIELD_INPUT_CLASS}
            />
          </label>
        </div>
      ) : (
        <label className="text-xs text-gray-600">
          Valor
          <input disabled={locked} type="number" value={condicion.valor as number} onChange={(event) => onChange((c) => ({ ...c, valor: Number(event.target.value) }))} className={FIELD_INPUT_CLASS} />
        </label>
      )}

      <label className="text-xs text-gray-600">
        Unidad
        <input disabled={locked} value={condicion.unidad} onChange={(event) => onChange((c) => ({ ...c, unidad: event.target.value }))} className={FIELD_INPUT_CLASS} />
      </label>

      {condicion.agregador === "dias_con_condicion" && condicion.subcondicion && (
        <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-6">
          <label className="text-xs text-gray-600">
            Subcondición · operador
            <select
              disabled={locked}
              value={condicion.subcondicion.operador}
              onChange={(event) => onChange((c) => ({ ...c, subcondicion: { ...c.subcondicion!, operador: event.target.value as SpecOperator } }))}
              className={FIELD_INPUT_CLASS}
            >
              {SPEC_OPERATORS.filter((op) => op !== "between").map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600">
            Subcondición · valor
            <input
              disabled={locked}
              type="number"
              value={condicion.subcondicion.valor}
              onChange={(event) => onChange((c) => ({ ...c, subcondicion: { ...c.subcondicion!, valor: Number(event.target.value) } }))}
              className={FIELD_INPUT_CLASS}
            />
          </label>
          <label className="text-xs text-gray-600">
            Subcondición · unidad
            <input
              disabled={locked}
              value={condicion.subcondicion.unidad}
              onChange={(event) => onChange((c) => ({ ...c, subcondicion: { ...c.subcondicion!, unidad: event.target.value } }))}
              className={FIELD_INPUT_CLASS}
            />
          </label>
        </div>
      )}

      {!locked && (
        <button type="button" onClick={onRemove} className="col-span-2 text-xs text-red-500 hover:underline sm:col-span-1">
          Eliminar condición
        </button>
      )}
    </div>
  );
}
