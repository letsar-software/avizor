import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getModelosAdministrables } from "@/lib/fenologia/repository";
import type { ModeloFenologico } from "@/types";

const ESTADO_STYLES: Record<ModeloFenologico["estado"], string> = {
  experimental: "bg-amber-50 text-amber-700",
  revisada: "bg-blue-50 text-blue-700",
  vigente: "bg-avizor-green-light text-avizor-green",
  retirada: "bg-gray-100 text-gray-500",
};

export default async function AdminFenologiaPage() {
  const actor = await requireAdminPageAccess("plagas_cultivos_fenologia", "read");
  const modelos = await getModelosAdministrables();
  const puedeEscribir = hasAccess(actor.rol, "plagas_cultivos_fenologia", "write");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Fenología</h1>
          <p className="text-sm text-gray-500">{modelos.length} modelos (no incluye retirados).</p>
        </div>
        {puedeEscribir && (
          <Link href="/admin/fenologia/nuevo" className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid">
            + Nuevo modelo
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Cultivo</th>
              <th className="px-4 py-3">Versión</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {modelos.map((modelo) => (
              <tr key={modelo.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{modelo.cultivo}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/fenologia/${modelo.id}`} className="font-medium text-avizor-green hover:underline">v{modelo.version}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{modelo.proveedor}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-medium ${ESTADO_STYLES[modelo.estado]}`}>{modelo.estado}</span></td>
              </tr>
            ))}
            {modelos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Todavía no hay modelos cargados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
