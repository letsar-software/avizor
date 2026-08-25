"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_INPUT_CLASS } from "@/components/admin/form-styles";
import { ADMIN_ROLES } from "@/lib/admin/user-spec";

export default function UsuarioForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<(typeof ADMIN_ROLES)[number]>("agronomo");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre, rol, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear el usuario.");
      setEmail("");
      setNombre("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4">
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
      <label className="text-sm text-gray-700">
        Contraseña inicial
        <input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={FIELD_INPUT_CLASS} />
      </label>
      <div className="flex items-end sm:col-span-4">
        <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
          {saving ? "Creando..." : "Crear usuario"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      <p className="text-xs text-gray-400 sm:col-span-4">
        Todavía no hay flujo de invitación por email: el usuario queda activo con esta contraseña y la puede cambiar más adelante desde su edición.
      </p>
    </form>
  );
}
