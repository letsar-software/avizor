"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CultivoActivoToggle({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    setSaving(true);
    try {
      await fetch(`/api/admin/cultivos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
      <input type="checkbox" checked={activo} disabled={saving} onChange={handleChange} />
      {activo ? "activo" : "inactivo"}
    </label>
  );
}
