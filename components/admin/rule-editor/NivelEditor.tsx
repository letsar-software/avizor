"use client";
import type { AggregatorKey, CondicionDefinicion, NivelRegla, SpecOperator } from "@/types";
import CondicionEditor from "@/components/admin/rule-editor/CondicionEditor";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";

interface NivelEditorProps {
  nivel: NivelRegla;
  locked: boolean;
  onUpdateField: <K extends keyof NivelRegla>(field: K, value: NivelRegla[K]) => void;
  onRemove: () => void;
  onAddCondicion: () => void;
  onRemoveCondicion: (condIndex: number) => void;
  onUpdateCondicion: (condIndex: number, updater: (condicion: CondicionDefinicion) => CondicionDefinicion) => void;
  onOperadorChange: (condIndex: number, operador: SpecOperator) => void;
  onAgregadorChange: (condIndex: number, agregador: AggregatorKey) => void;
}

export default function NivelEditor({ nivel, locked, onUpdateField, onRemove, onAddCondicion, onRemoveCondicion, onUpdateCondicion, onOperadorChange, onAgregadorChange }: NivelEditorProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm text-gray-700">
            Clave
            <input disabled={locked} value={nivel.clave} onChange={(event) => onUpdateField("clave", event.target.value)} className={FIELD_INPUT_CLASS} />
          </label>
          <label className="text-sm text-gray-700 sm:col-span-2">
            Etiqueta
            <input disabled={locked} value={nivel.etiqueta} onChange={(event) => onUpdateField("etiqueta", event.target.value)} className={FIELD_INPUT_CLASS} />
          </label>
          <label className="text-sm text-gray-700 sm:col-span-3">
            Explicación
            <input disabled={locked} value={nivel.explicacion ?? ""} onChange={(event) => onUpdateField("explicacion", event.target.value)} className={FIELD_INPUT_CLASS} />
          </label>
          <label className="text-sm text-gray-700 sm:col-span-3">
            Recomendación
            <input disabled={locked} value={nivel.recomendacion ?? ""} onChange={(event) => onUpdateField("recomendacion", event.target.value)} className={FIELD_INPUT_CLASS} />
          </label>
        </div>
        {!locked && (
          <button type="button" onClick={onRemove} className="shrink-0 text-xs text-red-500 hover:underline">
            Eliminar nivel
          </button>
        )}
      </div>

      <div className="space-y-2">
        {nivel.condiciones.map((condicion, condIndex) => (
          <CondicionEditor
            key={condIndex}
            condicion={condicion}
            locked={locked}
            onChange={(updater) => onUpdateCondicion(condIndex, updater)}
            onOperadorChange={(operador) => onOperadorChange(condIndex, operador)}
            onAgregadorChange={(agregador) => onAgregadorChange(condIndex, agregador)}
            onRemove={() => onRemoveCondicion(condIndex)}
          />
        ))}
        {!locked && (
          <button type="button" onClick={onAddCondicion} className="text-xs text-avizor-green hover:underline">
            + Agregar condición
          </button>
        )}
      </div>
    </div>
  );
}
