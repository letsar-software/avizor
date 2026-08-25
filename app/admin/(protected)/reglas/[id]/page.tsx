import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { getReglaAdministrableById } from "@/lib/rules/repository-v2";
import RuleEditor from "@/components/admin/RuleEditor";

export default async function AdminReglaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdminPageAccess("reglas", "read");
  const { id } = await params;
  const regla = await getReglaAdministrableById(id);
  if (!regla) notFound();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-avizor-navy">{regla.nombre ?? regla.clave}</h1>
      <p className="mb-6 text-sm text-gray-500">{regla.cultivo} · versión {regla.version} · {regla.clave}</p>
      <RuleEditor regla={regla} rol={actor.rol} />
    </div>
  );
}
