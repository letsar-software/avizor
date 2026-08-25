import type { AuditoriaEntry } from "@/types";

function formatJson(value: unknown) {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value, null, 2);
}

export default function AuditoriaTable({ entradas }: { entradas: AuditoriaEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Cuándo</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Acción</th>
            <th className="px-4 py-3">Entidad</th>
            <th className="px-4 py-3">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entradas.map((entrada) => {
            const anterior = formatJson(entrada.valor_anterior);
            const nuevo = formatJson(entrada.valor_nuevo);
            return (
              <tr key={entrada.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(entrada.created_at).toLocaleString("es-AR")}</td>
                <td className="px-4 py-3 text-gray-600">{entrada.actor_id} <span className="text-xs text-gray-400">({entrada.actor_tipo})</span></td>
                <td className="px-4 py-3 font-medium text-avizor-navy">{entrada.accion}</td>
                <td className="px-4 py-3 text-gray-600">{entrada.entidad}{entrada.entidad_id ? ` · ${entrada.entidad_id}` : ""}</td>
                <td className="px-4 py-3">
                  {(anterior || nuevo) ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-avizor-green">ver cambio</summary>
                      <div className="mt-2 space-y-2">
                        {anterior && <pre className="max-w-xs overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">{anterior}</pre>}
                        {nuevo && <pre className="max-w-xs overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">{nuevo}</pre>}
                      </div>
                    </details>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
          {entradas.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No hay eventos que coincidan con el filtro.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
