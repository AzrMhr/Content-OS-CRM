"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import * as f from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["admin", "editor", "viewer"];

export async function setRole(fd: FormData): Promise<void> {
  await requireAdmin();

  const id = f.requiredText(fd, "id", "Member id");
  const role = f.enumValue(fd, "role", ROLES);
  if (!role) throw new Error("Unknown role.");

  const supabase = await createClient();
  // The database also enforces this: a trigger refuses to demote the last admin.
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}

export async function updateOwnName(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You are signed out.");

    const fullName = f.requiredText(fd, "full_name", "Name");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    if (error) throw new Error(error.message);

    revalidatePath("/team");
    return { ok: true, id: user.id };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

/**
 * Removes the profile row, which revokes all access through RLS.
 * The auth user itself stays in Supabase; delete it from the dashboard
 * (Authentication -> Users) if you want the email freed up.
 */
export async function removeMember(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = f.requiredText(fd, "id", "Member id");
  if (id === admin.id) throw new Error("You cannot remove your own account.");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}
