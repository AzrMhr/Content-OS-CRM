import { notFound, redirect } from "next/navigation";
import { CreatorForm } from "@/components/creator-form";
import { PageHeader } from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Creator } from "@/lib/types";

export default async function EditCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  if (!canWrite(profile)) redirect(`/creators/${id}`);

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .maybeSingle<Creator>();

  if (!creator) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit creator" subtitle={creator.name} />
      <CreatorForm creator={creator} />
    </div>
  );
}
