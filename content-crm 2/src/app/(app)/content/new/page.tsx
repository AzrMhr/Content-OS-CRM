import { redirect } from "next/navigation";
import { ContentForm } from "@/components/content-form";
import { PageHeader } from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New content · Content CRM" };

export default async function NewContentPage() {
  const profile = await requireProfile();
  if (!canWrite(profile)) redirect("/content");

  const supabase = await createClient();
  const [{ data: creators }, { data: products }, { data: team }] = await Promise.all([
    supabase.from("creators").select("id, name, handle").order("name"),
    supabase.from("products").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  return (
    <div className="max-w-6xl">
      <PageHeader title="New content" subtitle="A video, a post or an ad creative." />
      <ContentForm
        creators={creators ?? []}
        products={products ?? []}
        team={(team ?? []).map((m) => ({
          id: m.id as string,
          name: (m.full_name as string | null) ?? (m.email as string | null) ?? "Teammate",
        }))}
      />
    </div>
  );
}
