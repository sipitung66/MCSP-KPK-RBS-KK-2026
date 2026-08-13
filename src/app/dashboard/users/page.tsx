import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getAllOPDList } from "@/lib/actions/dashboard.actions";
import { getAllUsers } from "@/lib/actions/users.actions";
import { UsersContent } from "./_UsersContent";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_UTAMA") redirect("/dashboard");

  const [opds, users] = await Promise.all([
    getAllOPDList(),
    getAllUsers(),
  ]);

  return (
    <AppShell title="Kelola User OPD" subtitle="Manajemen akun Admin OPD dan Admin Utama">
      <UsersContent opds={opds} initialUsers={users} />
    </AppShell>
  );
}
