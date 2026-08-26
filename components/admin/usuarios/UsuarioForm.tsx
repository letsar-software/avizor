"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { ADMIN_ROLES } from "@/lib/admin/user-spec";
import InvitationLinkReveal from "@/components/admin/usuarios/InvitationLinkReveal";

export default function UsuarioForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<(typeof ADMIN_ROLES)[number]>("agronomo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setInvitationToken(null);
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre, rol }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear el usuario.");
      setEmail("");
      setNombre("");
      setInvitationToken(data.data.invitacion.token as string);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <label className="text-sm text-gray-700">
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={FIELD_INPUT_CLASS} />
        </label>
        <label className="text-sm text-gray-700">
          Nombre
          <input required value={nombre} onChange={(event) => setNombre(event.target.value)} className={FIELD_INPUT_CLASS} />
        </label>
        <label className="text-sm text-gray-700">
          Rol
          <select value={rol} onChange={(event) => setRol(event.target.value as typeof rol)} className={FIELD_INPUT_CLASS}>
            {ADMIN_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="flex items-end sm:col-span-3">
          <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
            {saving ? "Creando..." : "Invitar usuario"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
        <p className="text-xs text-gray-400 sm:col-span-3">
          El usuario nace invitado, sin contraseña. Define la propia al aceptar el enlace de invitación.
        </p>
      </form>

      {invitationToken && <InvitationLinkReveal token={invitationToken} />}
    </div>
  );
}
