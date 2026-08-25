import { requireAdminPageAccess } from "@/lib/admin/access";
import NotConfiguredNotice from "@/components/admin/NotConfiguredNotice";

export default async function AdminIntegracionesPage() {
  await requireAdminPageAccess("configuracion", "read");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Integraciones</h1>
        <p className="text-sm text-gray-500">Todavía no hay integraciones de terceros en el código.</p>
      </div>
      <NotConfiguredNotice
        titulo="No hay ninguna integración externa configurada"
        motivo="La única forma que tienen terceros de conectarse hoy es la API con API Key (Fase 5, /admin/empresas). No hay integración saliente con ningún sistema externo (CRM, ERP, plataformas de agro) — el plan menciona este módulo como 'operación general' pero no especifica con qué debería integrar."
        requiere={[
          "Con qué sistemas externos necesita conectarse Avizor (¿un CRM para empresas B2B? ¿una plataforma de gestión agrícola?)",
          "Dirección de la integración: Avizor consume datos de terceros, o expone los suyos",
          "Modelo de autenticación del lado del tercero (OAuth, API key propia de ellos, webhook firmado)",
        ]}
      />
    </div>
  );
}
