"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Confirmación en la propia UI en vez de window.confirm(): los diálogos nativos
// del navegador no son confiables en todos los contextos donde puede correr el
// panel (por ejemplo quedan deshabilitados en este entorno de pruebas).
export default function RevokeApiKeyButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try {
      await fetch(`/api/admin/api-keys/${id}/revocar`, { method: "POST" });
      router.refresh();
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-gray-500">¿Seguro?</span>
        <button type="button" onClick={handleConfirm} disabled={saving} className="text-red-500 hover:underline disabled:opacity-60">
          {saving ? "Revocando..." : "Sí, revocar"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} disabled={saving} className="text-gray-400 hover:underline">
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="text-xs text-red-500 hover:underline">
      Revocar
    </button>
  );
}
