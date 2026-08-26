import { Suspense } from "react";
import AceptarInvitacionForm from "@/components/admin/usuarios/AceptarInvitacionForm";

export default function AdminInvitacionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-avizor-cream px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-avizor-navy">Panel de administración</h1>
        <p className="mb-6 text-sm text-gray-500">Avizor</p>
        <Suspense fallback={<p className="text-sm text-gray-500">Cargando...</p>}>
          <AceptarInvitacionForm />
        </Suspense>
      </div>
    </div>
  );
}
