import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getEmpresas } from "@/lib/empresas/repository";
import EmpresaForm from "@/components/admin/empresas/EmpresaForm";

const ESTADO_STYLES: Record<string, string> = {
  activa: "bg-avizor-green-light text-avizor-green",
  inactiva: "bg-gray-100 text-gray-500",
};

export default async function AdminEmpresasPage() {
  const actor = await requireAdminPageAccess("empresas", "read");
  const empresas = await getEmpresas();
  const puedeEscribir = hasAccess(actor.rol, "empresas", "write");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Empresas</h1>
        <p className="text-sm text-gray-500">{empresas.length} empresas con acceso a la API.</p>
      </div>

      {puedeEscribir && <EmpresaForm />}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresas.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/empresas/${empresa.id}`} className="font-medium text-avizor-green hover:underline">{empresa.nombre}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {empresa.contacto_nombre ?? "—"}
                  {empresa.contacto_email ? ` · ${empresa.contacto_email}` : ""}
                </td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-medium ${ESTADO_STYLES[empresa.estado]}`}>{empresa.estado}</span></td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Todavía no hay empresas cargadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
