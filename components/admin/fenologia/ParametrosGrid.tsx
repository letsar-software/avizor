"use client";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { GRUPOS_MADUREZ, HITOS_FENOLOGICOS_MAX, HITOS_FENOLOGICOS_MIN } from "@/lib/phenology/spec";
import type { GrupoMadurez, ModeloFenologicoParametros } from "@/types";

interface ParametrosGridProps {
  parametros: ModeloFenologicoParametros;
  locked: boolean;
  onOffsetChange: (grupo: GrupoMadurez, hitoIndex: number, valor: number) => void;
  onMargenChange: (valor: number) => void;
  onAddHito: () => void;
  onRemoveHito: (hitoIndex: number) => void;
  onHitoCodigoChange: (hitoIndex: number, codigo: string) => void;
  onHitoNombreChange: (hitoIndex: number, nombre: string) => void;
}

export default function ParametrosGrid({ parametros, locked, onOffsetChange, onMargenChange, onAddHito, onRemoveHito, onHitoCodigoChange, onHitoNombreChange }: ParametrosGridProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm text-gray-500">Hitos del modelo y días desde la siembra hasta cada uno, por grupo de madurez.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-2 pr-4">Grupo de madurez</th>
              {parametros.hitos.map((hito, hitoIndex) => (
                <th key={hitoIndex} className="px-2 py-2">
                  <div className="flex flex-col gap-1">
                    <input
                      disabled={locked}
                      value={hito.codigo}
                      onChange={(event) => onHitoCodigoChange(hitoIndex, event.target.value)}
                      placeholder="R1"
                      className={`${FIELD_INPUT_CLASS} w-16 font-mono uppercase`}
                    />
                    <input
                      disabled={locked}
                      value={hito.nombre}
                      onChange={(event) => onHitoNombreChange(hitoIndex, event.target.value)}
                      placeholder="Nombre del hito"
                      className={`${FIELD_INPUT_CLASS} w-32 font-normal normal-case`}
                    />
                    {!locked && parametros.hitos.length > HITOS_FENOLOGICOS_MIN && (
                      <button type="button" onClick={() => onRemoveHito(hitoIndex)} className="text-xs text-red-600 hover:underline">
                        Quitar
                      </button>
                    )}
                  </div>
                </th>
              ))}
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
      {!locked && parametros.hitos.length < HITOS_FENOLOGICOS_MAX && (
        <button type="button" onClick={onAddHito} className="mt-3 text-sm text-avizor-green hover:underline">
          + Agregar hito
        </button>
      )}
      <label className="mt-4 block w-40 text-sm text-gray-700">
        Margen (± días)
        <input disabled={locked} type="number" min={0} max={60} value={parametros.margen_dias} onChange={(event) => onMargenChange(Number(event.target.value))} className={FIELD_INPUT_CLASS} />
      </label>
    </div>
  );
}
