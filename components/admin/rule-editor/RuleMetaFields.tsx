"use client";
import type { ReglaAgronomicaV2 } from "@/types";
import { FIELD_INPUT_CLASS } from "@/components/admin/rule-editor/styles";

interface RuleMetaFieldsProps {
  estado: ReglaAgronomicaV2["estado"];
  estadoOptions: readonly ReglaAgronomicaV2["estado"][];
  onEstadoChange: (estado: ReglaAgronomicaV2["estado"]) => void;
  validadoPor: string;
  onValidadoPorChange: (value: string) => void;
  validadoEn: string;
  onValidadoEnChange: (value: string) => void;
}

export default function RuleMetaFields({ estado, estadoOptions, onEstadoChange, validadoPor, onValidadoPorChange, validadoEn, onValidadoEnChange }: RuleMetaFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
      <label className="text-sm text-gray-700">
        Estado
        <select value={estado} onChange={(event) => onEstadoChange(event.target.value as ReglaAgronomicaV2["estado"])} className={FIELD_INPUT_CLASS}>
          {estadoOptions.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Validado por
        <input value={validadoPor} onChange={(event) => onValidadoPorChange(event.target.value)} placeholder="Nombre de quien valida" className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Validado en
        <input type="datetime-local" value={validadoEn} onChange={(event) => onValidadoEnChange(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
    </div>
  );
}
