"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, requireWriter } from "@/lib/auth";
import * as f from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ContentGoal, ContentStatus, ContentUsage } from "@/lib/types";

const STATUSES: ContentStatus[] = [
  "idea",
  "brief_sent",
  "product_shipped",
  "scripting",
  "filming",
  "editing",
  "awaiting_approval",
  "scheduled",
  "posted",
  "archived",
];

const GOALS: ContentGoal[] = [
  "awareness",
  "engagement",
  "traffic",
  "sales",
  "social_proof",
  "retention",
];

const USAGES: ContentUsage[] = ["organic", "paid", "both"];

function readForm(fd: FormData) {
  return {
    title: f.requiredText(fd, "title", "Title"),
    status: f.requiredEnum(fd, "status", STATUSES, "idea"),
    formats: f.list(fd, "formats"),
    platforms: f.list(fd, "platforms"),
    goal: f.enumValue(fd, "goal", GOALS),
    usage: f.requiredEnum(fd, "usage", USAGES, "organic"),
    hook: f.text(fd, "hook"),
    brief: f.text(fd, "brief"),
    shot_list: f.text(fd, "shot_list"),
    caption: f.text(fd, "caption"),
    creator_id: f.text(fd, "creator_id"),
    product_id: f.text(fd, "product_id"),
    owner_id: f.text(fd, "owner_id"),
    due_date: f.date(fd, "due_date"),
    post_date: f.date(fd, "post_date"),
    rights_expire_on: f.date(fd, "rights_expire_on"),
    raw_footage_url: f.text(fd, "raw_footage_url"),
    edited_url: f.text(fd, "edited_url"),
    live_url: f.text(fd, "live_url"),
    views: f.integer(fd, "views"),
    likes: f.integer(fd, "likes"),
    comments: f.integer(fd, "comments"),
    ad_spend: f.number(fd, "ad_spend"),
    revenue: f.number(fd, "revenue"),
  };
}

export async function createContent(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  let newId: string | null = null;

  try {
    await requireWriter();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("content")
      .insert(readForm(fd))
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    newId = data.id as string;
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }

  revalidatePath("/content");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect(`/content/${newId}`);
}

export async function updateContent(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  try {
    await requireWriter();
    const id = f.requiredText(fd, "id", "Record id");
    const supabase = await createClient();

    const { error } = await supabase.from("content").update(readForm(fd)).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath(`/content/${id}`);
    revalidatePath("/content");
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

/** Used by the board when a card is dragged to another column. */
export async function moveContent(id: string, status: ContentStatus): Promise<ActionResult> {
  try {
    await requireWriter();
    if (!STATUSES.includes(status)) throw new Error("Unknown status.");

    const supabase = await createClient();
    const { error } = await supabase.from("content").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/pipeline");
    revalidatePath("/content");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

export async function addContentNote(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireWriter();
    const contentId = f.requiredText(fd, "content_id", "Record id");
    const note = f.requiredText(fd, "note", "Note");

    const supabase = await createClient();
    const { error } = await supabase.from("content_activity").insert({
      content_id: contentId,
      actor_id: profile.id,
      kind: "note",
      note,
    });
    if (error) throw new Error(error.message);

    revalidatePath(`/content/${contentId}`);
    return { ok: true, id: contentId };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

export async function deleteContent(fd: FormData): Promise<void> {
  await requireWriter();
  const id = f.requiredText(fd, "id", "Record id");

  const supabase = await createClient();
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/content");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect("/content");
}

/** Claim a piece of content as the owner, from the detail page. */
export async function claimContent(fd: FormData): Promise<void> {
  const profile = await requireWriter();
  const id = f.requiredText(fd, "id", "Record id");

  const supabase = await createClient();
  await supabase.from("content").update({ owner_id: profile.id }).eq("id", id);
  revalidatePath(`/content/${id}`);
}

export async function currentProfileId(): Promise<string> {
  const profile = await requireProfile();
  return profile.id;
}
