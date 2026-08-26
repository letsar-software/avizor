"use client";
import { useState } from "react";
import InvitationLinkReveal from "@/components/admin/usuarios/InvitationLinkReveal";

export default function ReenviarInvitacionButton({ usuarioId }: { usuarioId: string }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  async function handleClick() {
    setSending(true);
    setError(null);
    setInvitationToken(null);
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioId}/invitaciones`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos reenviar la invitación.");
      setInvitationToken(data.data.token as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos reenviar la invitación.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">Este usuario todavía no aceptó su invitación.</p>
        <button type="button" onClick={handleClick} disabled={sending} className="shrink-0 rounded border border-avizor-green px-3 py-1.5 text-sm font-medium text-avizor-green hover:bg-avizor-green-light disabled:opacity-60">
          {sending ? "Generando..." : "Reenviar invitación"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {invitationToken && <InvitationLinkReveal token={invitationToken} />}
    </div>
  );
}
