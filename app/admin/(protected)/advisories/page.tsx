import AdvisoryManager from "@/components/admin/AdvisoryManager";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { listAgronomicAdvisories } from "@/lib/advisories/repository";
import { getActiveRiskCategories } from "@/lib/rules/category-repository";

export default async function AdvisoriesPage() {
  await requireAdminPageAccess("reglas", "read");
  const [categories, advisories] = await Promise.all([getActiveRiskCategories(), listAgronomicAdvisories()]);
  return <div><h1 className="text-xl font-semibold text-avizor-navy">Validaciones técnicas</h1><p className="mb-6 mt-1 text-sm text-gray-500">Publicá contexto técnico temporal por categoría y alcance. Complementa las reglas, no las reemplaza.</p><AdvisoryManager categories={categories} initial={advisories} /></div>;
}
