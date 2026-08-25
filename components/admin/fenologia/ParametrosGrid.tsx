"use client";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { GRUPOS_MADUREZ } from "@/lib/phenology/spec";
import type { GrupoMadurez, ModeloFenologicoParametros } from "@/types";

interface ParametrosGridProps {
  parametros: ModeloFenologicoParametros;
  locked: boolean;
  onOffsetChange: (grupo: GrupoMadurez, hitoIndex: number, valor: number) => void;
  onMargenChange: (valor: number) => void;
}

export default function ParametrosGrid({ parametros, locked, onOffsetChange, onMargenChange }: ParametrosGridProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm text-gray-500">Días desde la siembra hasta cada hito, por grupo de madurez.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-2 pr-4">Grupo de madurez</th>
              {parametros.hitos.map((hito) => <th key={hito.codigo} className="px-2 py-2">{hito.codigo}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {GRUPOS_MADUREZ.map((grupo) => (
              <tr key={grupo}>
                <td className="py-2 pr-4 font-medium text-avizor-navy">{grupo}</td>
                {parametros.offsets_dias[grupo].map((dia, hitoIndex) => (
                  <td key={hitoIndex} className="px-2 py-2">
                    <input
                      disabled={locked}
                      type="number"
                      min={0}
                      value={dia}
                      onChange={(event) => onOffsetChange(grupo, hitoIndex, Number(event.target.value))}
                      className={`${FIELD_INPUT_CLASS} w-20`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="mt-4 block w-40 text-sm text-gray-700">
        Margen (± días)
        <input disabled={locked} type="number" min={0} max={60} value={parametros.margen_dias} onChange={(event) => onMargenChange(Number(event.target.value))} className={FIELD_INPUT_CLASS} />
      </label>
    </div>
  );
}
