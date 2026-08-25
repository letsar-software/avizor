import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { getModeloById } from "@/lib/fenologia/repository";
import ModeloEditForm from "@/components/admin/fenologia/ModeloEditForm";

export default async function AdminFenologiaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPageAccess("plagas_cultivos_fenologia", "read");
  const { id } = await params;
  const modelo = await getModeloById(id);
  if (!modelo) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">{modelo.cultivo} · v{modelo.version}</h1>
        <p className="text-sm text-gray-500">proveedor {modelo.proveedor}</p>
      </div>
      <ModeloEditForm modelo={modelo} />
    </div>
  );
}
