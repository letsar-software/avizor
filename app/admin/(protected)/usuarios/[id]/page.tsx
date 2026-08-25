import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getUsuarioById } from "@/lib/usuarios/repository";
import UsuarioEditForm from "@/components/admin/usuarios/UsuarioEditForm";

export default async function AdminUsuarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdminPageAccess("usuarios", "read");
  const { id } = await params;
  const usuario = await getUsuarioById(id);
  if (!usuario) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">{usuario.nombre}</h1>
        <p className="text-sm text-gray-500">
          {usuario.email}
          {usuario.invitado_por_nombre ? ` · invitado por ${usuario.invitado_por_nombre}` : ""}
        </p>
      </div>

      {hasAccess(actor.rol, "usuarios", "write") ? (
        <UsuarioEditForm usuario={usuario} />
      ) : (
        <p className="text-sm text-gray-500">No tenés permiso para editar usuarios.</p>
      )}
    </div>
  );
}
