import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/**
 * The signed-in user's profile, or a redirect to the login page.
 * Every page and action in the app goes through this.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profile) return profile;

  // The row is created by a database trigger. If it is somehow missing, fall
  // back to a read-only identity rather than crashing the page.
  return {
    id: user.id,
    email: user.email ?? null,
    full_name: user.email?.split("@")[0] ?? null,
    role: "viewer",
    created_at: new Date().toISOString(),
  };
}

export function canWrite(profile: Profile): boolean {
  return profile.role === "admin" || profile.role === "editor";
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === "admin";
}

/** For server actions: stop viewers before they reach the database. */
export async function requireWriter(): Promise<Profile> {
  const profile = await requireProfile();
  if (!canWrite(profile)) {
    throw new Error("Your account is read-only. Ask an admin for editor access.");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isAdmin(profile)) {
    throw new Error("Only an admin can do that.");
  }
  return profile;
}
