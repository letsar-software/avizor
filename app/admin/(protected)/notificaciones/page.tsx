import { requireAdminPageAccess } from "@/lib/admin/access";
import NotConfiguredNotice from "@/components/admin/NotConfiguredNotice";

export default async function AdminNotificacionesPage() {
  await requireAdminPageAccess("configuracion", "read");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Notificaciones</h1>
        <p className="text-sm text-gray-500">Todavía no hay infraestructura de envío en el código.</p>
      </div>
      <NotConfiguredNotice
        titulo="No hay canal de notificaciones configurado"
        motivo="Hoy Avizor no envía emails, SMS ni webhooks — ni siquiera el alta de un usuario nuevo (Fase 4) manda una invitación, el administrador carga la contraseña a mano. No hay nada que administrar acá todavía."
        requiere={[
          "Qué eventos deberían notificar (¿alta de usuario, alerta agronómica, límite de API alcanzado?)",
          "Qué canal usar (email transaccional, WhatsApp, webhook a un CRM externo) y con qué proveedor",
          "Quién recibe cada tipo de notificación — productor, agrónomo, empresa B2B",
        ]}
      />
    </div>
  );
}
