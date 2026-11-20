"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWriter } from "@/lib/auth";
import * as f from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, CreatorStatus, DealType, UsageRights } from "@/lib/types";

const STATUSES: CreatorStatus[] = [
  "prospect",
  "outreach_sent",
  "negotiating",
  "active",
  "paused",
  "not_a_fit",
];

const DEALS: DealType[] = ["gifted", "paid_per_video", "affiliate", "retainer"];
const RIGHTS: UsageRights[] = ["organic_only", "paid_30", "paid_90", "perpetual"];

function readForm(fd: FormData) {
  const rating = f.integer(fd, "rating");

  return {
    name: f.requiredText(fd, "name", "Name"),
    status: f.requiredEnum(fd, "status", STATUSES, "prospect"),
    niches: f.list(fd, "niches"),
    platforms: f.list(fd, "platforms"),
    handle: f.text(fd, "handle"),
    profile_url: f.text(fd, "profile_url"),
    email: f.text(fd, "email"),
    followers: f.integer(fd, "followers"),
    deal: f.enumValue(fd, "deal", DEALS),
    rate_per_video: f.number(fd, "rate_per_video"),
    rights: f.enumValue(fd, "rights", RIGHTS),
    rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    notes: f.text(fd, "notes"),
    last_contacted: f.date(fd, "last_contacted"),
  };
}

export async function createCreator(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  let newId: string | null = null;

  try {
    await requireWriter();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("creators")
      .insert(readForm(fd))
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    newId = data.id as string;
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }

  revalidatePath("/creators");
  revalidatePath("/dashboard");
  redirect(`/creators/${newId}`);
}

export async function updateCreator(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  try {
    await requireWriter();
    const id = f.requiredText(fd, "id", "Record id");
    const supabase = await createClient();

    const { error } = await supabase.from("creators").update(readForm(fd)).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath(`/creators/${id}`);
    revalidatePath("/creators");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

/** Quick status change from the roster table, without opening the record. */
export async function setCreatorStatus(id: string, status: CreatorStatus): Promise<ActionResult> {
  try {
    await requireWriter();
    if (!STATUSES.includes(status)) throw new Error("Unknown status.");

    const supabase = await createClient();
    const { error } = await supabase.from("creators").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/creators");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

export async function logCreatorContact(fd: FormData): Promise<void> {
  await requireWriter();
  const id = f.requiredText(fd, "id", "Record id");

  const supabase = await createClient();
  await supabase
    .from("creators")
    .update({ last_contacted: new Date().toISOString().slice(0, 10) })
    .eq("id", id);

  revalidatePath(`/creators/${id}`);
  revalidatePath("/creators");
}

export async function deleteCreator(fd: FormData): Promise<void> {
  await requireWriter();
  const id = f.requiredText(fd, "id", "Record id");

  const supabase = await createClient();
  const { error } = await supabase.from("creators").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/creators");
  redirect("/creators");
}
