import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getEmpresaById } from "@/lib/empresas/repository";
import { getApiKeysPorEmpresa } from "@/lib/empresas/api-keys-repository";
import EmpresaEditForm from "@/components/admin/empresas/EmpresaEditForm";
import ApiKeyForm from "@/components/admin/empresas/ApiKeyForm";
import ApiKeysTable from "@/components/admin/empresas/ApiKeysTable";

export default async function AdminEmpresaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdminPageAccess("empresas", "read");
  const { id } = await params;
  const empresa = await getEmpresaById(id);
  if (!empresa) notFound();

  const apiKeys = await getApiKeysPorEmpresa(id);
  const puedeEscribir = hasAccess(actor.rol, "empresas", "write");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">{empresa.nombre}</h1>
        <p className="text-sm text-gray-500">{empresa.contacto_email ?? "sin email de contacto"}</p>
      </div>

      {puedeEscribir && <EmpresaEditForm empresa={empresa} />}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-avizor-navy">API keys</h2>
        {puedeEscribir && <div className="mb-4"><ApiKeyForm empresaId={empresa.id} /></div>}
        <ApiKeysTable apiKeys={apiKeys} puedeEscribir={puedeEscribir} />
      </div>
    </div>
  );
}
