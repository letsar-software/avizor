"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { AdminActor } from "@/lib/admin/auth";
import { Button } from "@/components/ui/button";

export default function AdminHeader({ actor }: { actor: AdminActor }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="text-sm text-muted-foreground">
        Hola, <span className="font-medium text-foreground">{actor.nombre}</span> · {actor.rol}
      </div>
      <Button onClick={handleLogout} variant="ghost" size="sm">
        <LogOut />
        Cerrar sesión
      </Button>
    </header>
  );
}
