import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { getReglasAdministrables } from "@/lib/rules/repository-v2";
import type { ReglaAgronomicaV2 } from "@/types";

const ESTADO_STYLES: Record<ReglaAgronomicaV2["estado"], string> = {
  experimental: "bg-amber-50 text-amber-700",
  revisada: "bg-blue-50 text-blue-700",
  vigente: "bg-avizor-green-light text-avizor-green",
  retirada: "bg-gray-100 text-gray-500",
};

export default async function AdminReglasPage() {
  await requireAdminPageAccess("reglas", "read");
  const reglas = await getReglasAdministrables();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Reglas agronómicas</h1>
      <p className="mb-6 text-sm text-gray-500">{reglas.length} reglas (no incluye retiradas).</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Cultivo</th>
              <th className="px-4 py-3">Regla</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Versión</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Ventana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reglas.map((regla) => (
              <tr key={regla.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{regla.cultivo}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/reglas/${regla.id}`} className="font-medium text-avizor-green hover:underline">
                    {regla.nombre ?? regla.clave}
                  </Link>
                  <div className="text-xs text-gray-400">{regla.clave}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{regla.categoria ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{regla.version}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${ESTADO_STYLES[regla.estado]}`}>{regla.estado}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{regla.ventana_dias} días</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
