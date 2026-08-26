"use client";

// Construye el enlace en el cliente (necesita el origin actual) y lo muestra una sola
// vez, igual que la clave de una API key nueva — no hay envío de email en el proyecto.
export default function InvitationLinkReveal({ token }: { token: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/admin/invitacion?token=${token}` : "";

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="mb-1 text-sm font-medium text-amber-800">Copiá este enlace ahora — no se vuelve a mostrar. Válido por 7 días.</p>
      <code className="block break-all rounded bg-white px-3 py-2 text-sm text-gray-800">{url}</code>
    </div>
  );
}
