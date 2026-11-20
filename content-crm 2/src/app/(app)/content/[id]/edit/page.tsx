import { notFound, redirect } from "next/navigation";
import { ContentForm } from "@/components/content-form";
import { PageHeader } from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/lib/types";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  if (!canWrite(profile)) redirect(`/content/${id}`);

  const supabase = await createClient();
  const [{ data: content }, { data: creators }, { data: products }, { data: team }] =
    await Promise.all([
      supabase.from("content").select("*").eq("id", id).maybeSingle<Content>(),
      supabase.from("creators").select("id, name, handle").order("name"),
      supabase.from("products").select("id, name").order("name"),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);

  if (!content) notFound();

  return (
    <div className="max-w-6xl">
      <PageHeader title="Edit content" subtitle={content.title} />
      <ContentForm
        content={content}
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
