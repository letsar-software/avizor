import { requireAdminPageAccess } from "@/lib/admin/access";
import { getAccionesAuditadas, getAuditoria, getEntidadesAuditadas } from "@/lib/auditoria/repository";
import AuditoriaTable from "@/components/admin/auditoria/AuditoriaTable";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";

interface SearchParams { entidad?: string; accion?: string }

export default async function AdminAuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminPageAccess("auditoria", "read");
  const { entidad, accion } = await searchParams;

  const [entradas, entidades, acciones] = await Promise.all([
    getAuditoria({ entidad, accion }),
    getEntidadesAuditadas(),
    getAccionesAuditadas(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Auditoría</h1>
        <p className="text-sm text-gray-500">Últimos {entradas.length} eventos{entidad || accion ? " (filtrado)" : ""}.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label className="text-sm text-gray-700">
          Entidad
          <select name="entidad" defaultValue={entidad ?? ""} className={`${FIELD_INPUT_CLASS} w-48`}>
            <option value="">Todas</option>
            {entidades.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Acción
          <select name="accion" defaultValue={accion ?? ""} className={`${FIELD_INPUT_CLASS} w-48`}>
            <option value="">Todas</option>
            {acciones.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid">Filtrar</button>
        {(entidad || accion) && <a href="/admin/auditoria" className="text-sm text-gray-500 hover:underline">Limpiar filtro</a>}
      </form>

      <AuditoriaTable entradas={entradas} />
    </div>
  );
}
