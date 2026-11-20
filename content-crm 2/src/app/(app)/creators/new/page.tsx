import { redirect } from "next/navigation";
import { CreatorForm } from "@/components/creator-form";
import { PageHeader } from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";

export const metadata = { title: "Add creator · Content CRM" };

export default async function NewCreatorPage() {
  const profile = await requireProfile();
  if (!canWrite(profile)) redirect("/creators");

  return (
    <div className="max-w-3xl">
      <PageHeader title="Add creator" subtitle="Someone you work with, or want to." />
      <CreatorForm />
    </div>
  );
}
