import { requireAdminPageAccess } from "@/lib/admin/access";
import { getDashboardMetrics } from "@/lib/dashboard/repository";
import StatCard from "@/components/admin/StatCard";
import BreakdownList from "@/components/admin/dashboard/BreakdownList";

export default async function AdminDashboardPage() {
  await requireAdminPageAccess("dashboard", "read");
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Dashboard</h1>
        <p className="text-sm text-gray-500">Métricas en vivo de la base de Avizor.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Consultas (7 días)" value={metrics.consultas.ultimos_7_dias} />
        <StatCard label="Consultas (30 días)" value={metrics.consultas.ultimos_30_dias} />
        <StatCard label="Consultas totales" value={metrics.consultas.total} />
        <StatCard label="Reglas activas" value={metrics.reglas_activas} hint="vigentes + experimentales" />
        <StatCard label="Cultivos activos" value={metrics.cultivos_activos} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BreakdownList
          title="Consultas por estado general"
          items={metrics.por_estado_general.map((item) => ({ label: item.estado_general, total: item.total }))}
        />
        <BreakdownList
          title="Cobertura de datos (confianza)"
          items={metrics.por_confianza.map((item) => ({ label: item.confianza, total: item.total }))}
        />
      </div>
    </div>
  );
}
