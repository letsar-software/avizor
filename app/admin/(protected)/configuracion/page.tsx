import { requireAdminPageAccess } from "@/lib/admin/access";
import { featureFlags } from "@/lib/config/featureFlags";
import { getConfigSnapshot } from "@/lib/sistema/config-snapshot";

const FLAG_LABELS: Record<keyof typeof featureFlags, string> = {
  enableMaiz: "Cultivo maíz",
  enableAlertas: "Alertas automáticas",
  enableObservaciones: "Observación del lote",
  enableModoExperimental: "Modo experimental",
  enablePlagas: "Módulo de plagas",
};

export default async function AdminConfiguracionPage() {
  await requireAdminPageAccess("configuracion", "read");
  const config = getConfigSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Configuración</h1>
        <p className="text-sm text-gray-500">
          De solo lectura: estos valores vienen de variables de entorno en Railway. Cambiarlos requiere un redeploy, no hay edición desde acá todavía.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-avizor-navy">Feature flags</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(featureFlags) as (keyof typeof featureFlags)[]).map((key) => (
            <div key={key} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2 text-sm">
              <span className="text-gray-700">{FLAG_LABELS[key]}</span>
              <span className={`rounded px-2 py-1 text-xs font-medium ${featureFlags[key] ? "bg-avizor-green-light text-avizor-green" : "bg-gray-100 text-gray-500"}`}>
                {featureFlags[key] ? "activo" : "inactivo"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-avizor-navy">Entorno</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between border-b border-gray-100 py-1"><dt className="text-gray-500">NODE_ENV</dt><dd className="text-gray-700">{config.nodeEnv}</dd></div>
          <div className="flex justify-between border-b border-gray-100 py-1"><dt className="text-gray-500">TLS a Postgres</dt><dd className="text-gray-700">{config.databaseSsl ? "activo" : "inactivo"}</dd></div>
          <div className="flex justify-between border-b border-gray-100 py-1"><dt className="text-gray-500">Verificación de certificado</dt><dd className="text-gray-700">{config.databaseSslRejectUnauthorized ? "activa" : "desactivada"}</dd></div>
          <div className="flex justify-between border-b border-gray-100 py-1"><dt className="text-gray-500">Proxy confiable (rate limit)</dt><dd className="text-gray-700">{config.rateLimitTrustedProxy ?? "sin configurar"}</dd></div>
          <div className="flex justify-between border-b border-gray-100 py-1"><dt className="text-gray-500">Secreto de rate limit</dt><dd className="text-gray-700">{config.rateLimitHashSecretConfigurado ? "configurado" : "sin configurar"}</dd></div>
          <div className="flex justify-between border-b border-gray-100 py-1"><dt className="text-gray-500">Token de servicio interno</dt><dd className="text-gray-700">{config.avizorInternalTokenConfigurado ? "configurado" : "sin configurar"}</dd></div>
        </dl>
      </div>
    </div>
  );
}
