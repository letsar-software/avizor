import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getPlagaById, getRegionalesByPlaga, getZonas } from "@/lib/plagas/repository";
import PlagaEditForm from "@/components/admin/plagas/PlagaEditForm";
import RegionalesTable from "@/components/admin/plagas/RegionalesTable";
import RegionalForm from "@/components/admin/plagas/RegionalForm";

export default async function AdminPlagaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdminPageAccess("plagas_cultivos_fenologia", "read");
  const { id } = await params;
  const plaga = await getPlagaById(id);
  if (!plaga) notFound();

  const [regionales, zonas] = await Promise.all([getRegionalesByPlaga(id), getZonas()]);
  const puedeEscribir = hasAccess(actor.rol, "plagas_cultivos_fenologia", "write");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">{plaga.nombre}</h1>
        <p className="text-sm text-gray-500">{plaga.cultivo} · {plaga.grupo_plaga}{plaga.especie ? ` · ${plaga.especie}` : ""} · versión {plaga.version}</p>
      </div>

      {puedeEscribir ? <PlagaEditForm plaga={plaga} /> : null}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-avizor-navy">Regionalización</h2>
        <p className="mb-3 text-sm text-gray-500">Prioridad de la plaga por zona y período — se versiona aparte de la regla climática (plan §3.2).</p>
        {puedeEscribir && <div className="mb-4"><RegionalForm plagaId={plaga.id} zonas={zonas} /></div>}
        <RegionalesTable regionales={regionales} />
      </div>
    </div>
  );
}
