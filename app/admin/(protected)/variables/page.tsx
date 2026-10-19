import { requireAdminPageAccess } from "@/lib/admin/access";
import { getReglasAdministrables } from "@/lib/rules/repository-v2";
import { CONFIGURED_CLIMATE_PROVIDER, catalogEntries } from "@/lib/variables/catalog";
import { listVariables, variableUsage } from "@/lib/variables/repository";

const COVERAGE_LABEL: Record<string, string> = {
  proveedor: "Disponible en el proveedor",
  no_disponible: "No disponible en el proveedor",
  dato_de_campo: "Dato de campo",
  fenologia: "Fenología",
  desconocida: "Sin catálogo",
};

export default async function VariablesPage() {
  await requireAdminPageAccess("reglas", "read");
  const [catalog, rules] = await Promise.all([listVariables(), getReglasAdministrables()]);
  const entries = catalogEntries(catalog.variables, variableUsage(rules));
  return (
    <div>
      <h1 className="text-xl font-semibold text-avizor-navy">Variables</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Catálogo reutilizable por todas las reglas y cultivos. Proveedor climático configurado: <code>{CONFIGURED_CLIMATE_PROVIDER}</code>.
        Las variables nuevas se crean desde el editor de cada regla.
      </p>
      {!catalog.administrable ? (
        <p className="mb-4 rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Se muestra el catálogo base: la tabla administrable se crea con la migración 032.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="p-3">Variable</th><th className="p-3">Descripción</th><th className="p-3">Unidad</th>
              <th className="p-3">Origen</th><th className="p-3">Proveedor</th><th className="p-3">Usada en</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.clave} className="border-b align-top last:border-0">
                <td className="p-3"><span className="block font-medium">{entry.etiqueta}</span><code className="text-xs text-gray-500">{entry.clave}</code></td>
                <td className="p-3 text-gray-600">{entry.descripcion || "—"}</td>
                <td className="p-3">{entry.unidad ?? "—"}</td>
                <td className="p-3">{entry.origen}</td>
                <td className="p-3">{COVERAGE_LABEL[entry.cobertura_proveedor]}</td>
                <td className="p-3 text-xs">
                  {entry.uso.length
                    ? entry.uso.map((use) => (
                        <span key={`${use.regla_id}-${use.lista}`} className="block">
                          {use.clave} v{use.version} · {use.cultivo} · {use.lista}
                        </span>
                      ))
                    : <span className="text-gray-400">Sin uso</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
