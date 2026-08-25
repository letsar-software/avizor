import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const actor = await getAdminSession(token);
  if (!actor) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-avizor-cream">
      <AdminSidebar rol={actor.rol} />
      <div className="flex flex-1 flex-col">
        <AdminHeader actor={actor} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
