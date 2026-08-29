import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getAllAreas, getAllOPDList } from "@/lib/actions/dashboard.actions";
import { getAllTaggingProfiles } from "@/lib/actions/tagging.actions";
import { TaggingContent } from "./_TaggingContent";

export default async function TaggingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_UTAMA") redirect("/dashboard");

  const [opds, profiles] = await Promise.all([
    getAllOPDList(),
    getAllTaggingProfiles(),
  ]);

  return (
    <AppShell title="Kelola Tagging OPD" subtitle="Atur kewajiban dokumen dan kertas kerja per OPD dan area">
      <TaggingContent opds={opds} initialProfiles={profiles} />
    </AppShell>
  );
}
