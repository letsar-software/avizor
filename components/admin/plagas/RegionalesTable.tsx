import type { PlagaRegional } from "@/types";

const ESTADO_STYLES: Record<string, string> = {
  vigente: "bg-avizor-green-light text-avizor-green",
  revisada: "bg-blue-50 text-blue-700",
  borrador: "bg-amber-50 text-amber-700",
  retirada: "bg-gray-100 text-gray-500",
};

function mesesLabel(regional: PlagaRegional) {
  if (!regional.meses_desde || !regional.meses_hasta) return "todo el año";
  return `mes ${regional.meses_desde} a ${regional.meses_hasta}`;
}

export default function RegionalesTable({ regionales }: { regionales: PlagaRegional[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Zona</th>
            <th className="px-4 py-3">Prioridad</th>
            <th className="px-4 py-3">Período</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fuente</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {regionales.map((regional) => (
            <tr key={regional.id}>
              <td className="px-4 py-3 font-medium text-avizor-navy">{regional.zona_nombre ?? regional.zona_id}</td>
              <td className="px-4 py-3 text-gray-600">{regional.prioridad}</td>
              <td className="px-4 py-3 text-gray-600">{mesesLabel(regional)}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-medium ${ESTADO_STYLES[regional.estado]}`}>{regional.estado}</span></td>
              <td className="px-4 py-3 text-gray-500">{regional.fuente_id ?? "—"}</td>
            </tr>
          ))}
          {regionales.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Todavía no hay zonas asociadas a esta plaga.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
