"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Estado = "cargando" | "valida" | "invalida";

export default function AceptarInvitacionForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [estado, setEstado] = useState<Estado>("cargando");
  const [invitado, setInvitado] = useState<{ email: string; nombre: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setEstado("invalida"); return; }
    fetch(`/api/admin/auth/aceptar-invitacion?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error();
        setInvitado(data.data);
        setEstado("valida");
      })
      .catch(() => setEstado("invalida"));
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmacion) { setError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/auth/aceptar-invitacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos activar la cuenta.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos activar la cuenta.");
    } finally {
      setSaving(false);
    }
  }

  if (estado === "cargando") return <p className="text-sm text-gray-500">Validando invitación...</p>;
  if (estado === "invalida") return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">Este enlace de invitación no es válido o venció. Pedile a un administrador que te reenvíe uno nuevo.</p>;

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-6 text-sm text-gray-500">Hola {invitado?.nombre} — activá tu cuenta ({invitado?.email}) eligiendo tu contraseña.</p>

      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <label className="mb-3 block text-sm text-gray-700">
        Contraseña
        <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-avizor-green focus:outline-none" />
      </label>
      <label className="mb-6 block text-sm text-gray-700">
        Confirmar contraseña
        <input type="password" required minLength={8} autoComplete="new-password" value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-avizor-green focus:outline-none" />
      </label>

      <button type="submit" disabled={saving} className="w-full rounded bg-avizor-green py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Activando..." : "Activar cuenta"}
      </button>
    </form>
  );
}
