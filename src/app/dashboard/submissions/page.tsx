import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getAllAreas, getAllOPDList } from "@/lib/actions/dashboard.actions";
import { getSubmissionsByOPD } from "@/lib/actions/submissions.actions";
import { SubmissionsContent } from "./_SubmissionsContent";

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [areas, opds, submissions] = await Promise.all([
    getAllAreas(),
    getAllOPDList(),
    getSubmissionsByOPD(
      user.role === "ADMIN_UTAMA" ? undefined : user.opdName ?? undefined
    ),
  ]);

  return (
    <AppShell title="Unggah Dokumen Bukti Dukung" subtitle="Kelola dan unggah dokumen bukti dukung MCSP">
      <SubmissionsContent
        user={{
          email: user.email,
          role: user.role as "ADMIN_UTAMA" | "ADMIN_OPD",
          opdName: user.opdName ?? null,
        }}
        areas={areas}
        opds={opds}
        initialSubmissions={submissions}
      />
    </AppShell>
  );
}
