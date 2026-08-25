import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";
import { getUsuarios } from "@/lib/usuarios/repository";
import UsuarioForm from "@/components/admin/usuarios/UsuarioForm";

const ESTADO_STYLES: Record<string, string> = {
  activo: "bg-avizor-green-light text-avizor-green",
  invitado: "bg-blue-50 text-blue-700",
  inactivo: "bg-gray-100 text-gray-500",
  bloqueado: "bg-red-50 text-red-600",
};

export default async function AdminUsuariosPage() {
  const actor = await requireAdminPageAccess("usuarios", "read");
  const usuarios = await getUsuarios();
  const puedeEscribir = hasAccess(actor.rol, "usuarios", "write");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Usuarios</h1>
        <p className="text-sm text-gray-500">{usuarios.length} usuarios del panel.</p>
      </div>

      {puedeEscribir && <UsuarioForm />}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Último acceso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/usuarios/${usuario.id}`} className="font-medium text-avizor-green hover:underline">{usuario.nombre}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{usuario.email}</td>
                <td className="px-4 py-3 text-gray-600">{usuario.rol}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-medium ${ESTADO_STYLES[usuario.estado]}`}>{usuario.estado}</span></td>
                <td className="px-4 py-3 text-gray-500">{usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString("es-AR") : "nunca"}</td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Todavía no hay usuarios cargados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
