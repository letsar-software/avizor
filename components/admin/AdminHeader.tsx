"use client";
import { useRouter } from "next/navigation";
import type { AdminActor } from "@/lib/admin/auth";

export default function AdminHeader({ actor }: { actor: AdminActor }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="text-sm text-gray-500">
        Hola, <span className="font-medium text-avizor-navy">{actor.nombre}</span> · {actor.rol}
      </div>
      <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-avizor-navy">
        Cerrar sesión
      </button>
    </header>
  );
}
