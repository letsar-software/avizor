import { requireAdminPageAccess } from "@/lib/admin/access";
import { getModeloVigente } from "@/lib/fenologia/repository";
import ModeloCreateForm from "@/components/admin/fenologia/ModeloCreateForm";

export default async function AdminFenologiaNuevoPage() {
  await requireAdminPageAccess("plagas_cultivos_fenologia", "write");
  // Precarga la grilla con el modelo vigente actual como punto de partida —
  // equivale a "forkear" desde el que ya está corriendo, en vez de arrancar de cero.
  const vigente = await getModeloVigente("soja");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Nuevo modelo de fenología</h1>
        <p className="text-sm text-gray-500">
          {vigente ? `Precargado con los coeficientes del modelo vigente v${vigente.version}.` : "Precargado con el modelo por defecto."}
        </p>
      </div>
      <ModeloCreateForm basadoEn={vigente?.parametros} />
    </div>
  );
}
