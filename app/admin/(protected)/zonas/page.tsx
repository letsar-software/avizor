import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getZonas } from "@/lib/plagas/repository";
import ZonaForm from "@/components/admin/plagas/ZonaForm";

export default async function AdminZonasPage() {
  const actor = await requireAdminPageAccess("plagas_cultivos_fenologia", "read");
  const zonas = await getZonas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Zonas agronómicas</h1>
        <p className="text-sm text-gray-500">Criterio geográfico todavía sin definir (PEND-10 del documento de plagas) — por ahora es solo clave + nombre.</p>
      </div>

      {hasAccess(actor.rol, "plagas_cultivos_fenologia", "write") && <ZonaForm />}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Clave</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Activa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {zonas.map((zona) => (
              <tr key={zona.id}>
                <td className="px-4 py-3 text-gray-600">{zona.clave}</td>
                <td className="px-4 py-3 font-medium text-avizor-navy">{zona.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{zona.activa ? "sí" : "no"}</td>
              </tr>
            ))}
            {zonas.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Todavía no hay zonas cargadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
