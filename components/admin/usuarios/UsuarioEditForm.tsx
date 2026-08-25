"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { ADMIN_ROLES, ADMIN_USER_ESTADOS } from "@/lib/admin/user-spec";
import type { AdminUsuario } from "@/types";

export default function UsuarioEditForm({ usuario }: { usuario: AdminUsuario }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [rol, setRol] = useState(usuario.rol);
  const [estado, setEstado] = useState(usuario.estado);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      if (nombre !== usuario.nombre) payload.nombre = nombre;
      if (rol !== usuario.rol) payload.rol = rol;
      if (estado !== usuario.estado) payload.estado = estado;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos guardar los cambios.");
      setPassword("");
      setMessage("Cambios guardados.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4">
      {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      {message && <p className="text-sm text-avizor-green sm:col-span-4">{message}</p>}

      <label className="text-sm text-gray-700">
        Nombre
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <label className="text-sm text-gray-700">
        Rol
        <select value={rol} onChange={(event) => setRol(event.target.value as typeof rol)} className={FIELD_INPUT_CLASS}>
          {ADMIN_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Estado
        <select value={estado} onChange={(event) => setEstado(event.target.value as typeof estado)} className={FIELD_INPUT_CLASS}>
          {ADMIN_USER_ESTADOS.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Nueva contraseña (opcional)
        <input type="password" minLength={8} placeholder="dejar vacío para no cambiar" value={password} onChange={(event) => setPassword(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>

      <div className="flex items-end">
        <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
