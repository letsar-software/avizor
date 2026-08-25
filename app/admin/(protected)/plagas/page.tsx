import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getCatalogoPlagas } from "@/lib/plagas/repository";
import PlagaCreateForm from "@/components/admin/plagas/PlagaCreateForm";

const ESTADO_STYLES: Record<string, string> = {
  activa: "bg-avizor-green-light text-avizor-green",
  catalogada: "bg-blue-50 text-blue-700",
  retirada: "bg-gray-100 text-gray-500",
};

export default async function AdminPlagasPage() {
  const actor = await requireAdminPageAccess("plagas_cultivos_fenologia", "read");
  const plagas = await getCatalogoPlagas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Plagas</h1>
        <p className="text-sm text-gray-500">{plagas.length} plagas catalogadas.</p>
      </div>

      {hasAccess(actor.rol, "plagas_cultivos_fenologia", "write") && <PlagaCreateForm />}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Cultivo</th>
              <th className="px-4 py-3">Plaga</th>
              <th className="px-4 py-3">Grupo</th>
              <th className="px-4 py-3">Tipo de regla</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Versión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plagas.map((plaga) => (
              <tr key={plaga.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{plaga.cultivo}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/plagas/${plaga.id}`} className="font-medium text-avizor-green hover:underline">{plaga.nombre}</Link>
                  <div className="text-xs text-gray-400">{plaga.grupo_plaga}{plaga.especie ? ` · ${plaga.especie}` : ""}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{plaga.grupo_plaga}</td>
                <td className="px-4 py-3 text-gray-600">{plaga.tipo_regla}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-medium ${ESTADO_STYLES[plaga.estado_catalogo]}`}>{plaga.estado_catalogo}</span></td>
                <td className="px-4 py-3 text-gray-600">{plaga.version}</td>
              </tr>
            ))}
            {plagas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Todavía no hay plagas catalogadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
