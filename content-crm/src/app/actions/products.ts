"use server";

import { revalidatePath } from "next/cache";
import { requireWriter } from "@/lib/auth";
import * as f from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ProductPriority } from "@/lib/types";

const PRIORITIES: ProductPriority[] = ["hero", "core", "new_launch", "seasonal"];

function readForm(fd: FormData) {
  return {
    name: f.requiredText(fd, "name", "Product name"),
    priority: f.requiredEnum(fd, "priority", PRIORITIES, "core"),
    category: f.text(fd, "category"),
    price: f.number(fd, "price"),
    url: f.text(fd, "url"),
    benefits: f.text(fd, "benefits"),
    pain_points: f.text(fd, "pain_points"),
    offer: f.text(fd, "offer"),
  };
}

export async function saveProduct(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  try {
    await requireWriter();
    const id = f.text(fd, "id");
    const supabase = await createClient();

    if (id) {
      const { error } = await supabase.from("products").update(readForm(fd)).eq("id", id);
      if (error) throw new Error(error.message);
      revalidatePath("/products");
      return { ok: true, id };
    }

    const { data, error } = await supabase
      .from("products")
      .insert(readForm(fd))
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { ok: true, id: data.id as string };
  } catch (error) {
    return { ok: false, error: f.errorMessage(error) };
  }
}

export async function deleteProduct(fd: FormData): Promise<void> {
  await requireWriter();
  const id = f.requiredText(fd, "id", "Record id");

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/products");
}
