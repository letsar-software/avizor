import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getCultivos } from "@/lib/cultivos/repository";
import CultivoForm from "@/components/admin/cultivos/CultivoForm";
import CultivoActivoToggle from "@/components/admin/cultivos/CultivoActivoToggle";

export default async function AdminCultivosPage() {
  const actor = await requireAdminPageAccess("plagas_cultivos_fenologia", "read");
  const cultivos = await getCultivos();
  const puedeEscribir = hasAccess(actor.rol, "plagas_cultivos_fenologia", "write");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Cultivos</h1>
        <p className="text-sm text-gray-500">{cultivos.length} cultivos cargados. Solo los activos aparecen como opción en la consulta pública.</p>
      </div>

      {puedeEscribir && <CultivoForm />}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Clave</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Feature flag</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cultivos.map((cultivo) => (
              <tr key={cultivo.id}>
                <td className="px-4 py-3 text-gray-600">{cultivo.clave}</td>
                <td className="px-4 py-3 font-medium text-avizor-navy">{cultivo.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{cultivo.feature_flag ?? "—"}</td>
                <td className="px-4 py-3">
                  {puedeEscribir ? (
                    <CultivoActivoToggle id={cultivo.id} activo={cultivo.activo} />
                  ) : (
                    <span className="text-gray-600">{cultivo.activo ? "activo" : "inactivo"}</span>
                  )}
                </td>
              </tr>
            ))}
            {cultivos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Todavía no hay cultivos cargados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
