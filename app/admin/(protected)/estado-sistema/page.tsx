import { requireAdminPageAccess } from "@/lib/admin/access";
import { getEstadoSistema } from "@/lib/sistema/repository";
import { featureFlags } from "@/lib/config/featureFlags";
import StatCard from "@/components/admin/StatCard";

export default async function AdminEstadoSistemaPage() {
  await requireAdminPageAccess("configuracion", "read");
  const estado = await getEstadoSistema();
  const flagsActivos = Object.entries(featureFlags).filter(([, activo]) => activo).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Estado del sistema</h1>
        <p className="text-sm text-gray-500">Chequeos reales contra la base — no es un dato hardcodeado.</p>
      </div>

      <div className={`rounded-lg border p-4 text-sm ${estado.baseDeDatos.conectada ? "border-avizor-green-light bg-avizor-green-light text-avizor-green" : "border-red-200 bg-red-50 text-red-700"}`}>
        {estado.baseDeDatos.conectada
          ? `Base de datos conectada (${estado.baseDeDatos.latenciaMs} ms). ${estado.baseDeDatos.version ?? ""}`
          : "No se pudo conectar a la base de datos."}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Feature flags activos" value={`${flagsActivos} / ${Object.keys(featureFlags).length}`} />
        <StatCard label="Última consulta" value={estado.ultimaConsultaEn ? new Date(estado.ultimaConsultaEn).toLocaleString("es-AR") : "sin registros"} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Tabla clave</th>
              <th className="px-4 py-3">Existe</th>
              <th className="px-4 py-3">Filas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {estado.tablas.map((tabla) => (
              <tr key={tabla.tabla}>
                <td className="px-4 py-3 font-medium text-avizor-navy">{tabla.tabla}</td>
                <td className="px-4 py-3">
                  {tabla.existe ? (
                    <span className="rounded bg-avizor-green-light px-2 py-1 text-xs font-medium text-avizor-green">sí</span>
                  ) : (
                    <span className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">no</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{tabla.filas ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
