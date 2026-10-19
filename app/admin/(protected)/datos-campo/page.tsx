import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { listFieldData } from "@/lib/field-data/repository";
import { listVariables } from "@/lib/variables/repository";
import { listLots } from "@/lib/lots/repository";
import FieldDataManager from "@/components/admin/FieldDataManager";

export default async function FieldDataPage() {
  const actor = await requireAdminPageAccess("datos_campo", "read");
  const [catalog, records, lots] = await Promise.all([listVariables(), listFieldData(), listLots()]);
  return (
    <div>
      <h1 className="text-xl font-semibold text-avizor-navy">Datos de campo</h1>
      <p className="mb-6 mt-1 text-sm text-gray-500">
        Datos de lote por variable. Una empresa sólo accede a sus lotes con su API key. Un dato vigente prevalece sobre la estimación climática cuando una regla lo usa;
        vencido o marcado como histórico, la variable vuelve a pedirse en “Para completar la evaluación”.
      </p>
      {!catalog.administrable ? (
        <p className="mb-4 rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">
          La carga se habilita al aplicar la migración 032 (catálogo y tabla de datos de campo).
        </p>
      ) : null}
      <FieldDataManager
        variables={catalog.variables.filter((variable) => variable.activa)}
        initial={records}
        lots={lots}
        canWrite={catalog.administrable && hasAccess(actor.rol, "datos_campo", "write")}
      />
    </div>
  );
}
