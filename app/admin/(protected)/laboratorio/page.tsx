import { requireAdminPageAccess } from "@/lib/admin/access";
import RuleLab from "@/components/admin/RuleLab";

export default async function AdminLaboratorioPage() {
  await requireAdminPageAccess("laboratorio", "read");

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Laboratorio</h1>
      <p className="mb-6 text-sm text-gray-500">Simulá una consulta real para ver qué reglas se disparan y con qué datos.</p>
      <RuleLab />
    </div>
  );
}
