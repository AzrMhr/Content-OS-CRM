"use client";

import { useActionState } from "react";
import { saveProduct } from "@/app/actions/products";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { PRODUCT_PRIORITIES } from "@/lib/constants";
import type { ActionResult, Product } from "@/lib/types";

export function ProductForm({
  product,
  onDone,
}: {
  product?: Product;
  /** Rendered next to the save button, e.g. a cancel link. */
  onDone?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveProduct,
    null,
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Field label="Product name">
        <Input name="name" required defaultValue={product?.name ?? ""} placeholder="Glow Serum 30ml" />
      </Field>

      <Field label="Priority">
        <Select name="priority" defaultValue={product?.priority ?? "core"}>
          {PRODUCT_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Category">
        <Input name="category" defaultValue={product?.category ?? ""} placeholder="Skincare" />
      </Field>

      <Field label="Price">
        <Input
          type="number"
          min={0}
          step="0.01"
          name="price"
          defaultValue={product?.price ?? ""}
        />
      </Field>

      <Field label="Product page" className="md:col-span-2">
        <Input type="url" name="url" defaultValue={product?.url ?? ""} />
      </Field>

      <Field label="Key benefits" hint="What creators should say about it.">
        <Textarea name="benefits" rows={3} defaultValue={product?.benefits ?? ""} />
      </Field>

      <Field label="Customer pain points" hint="The problem it solves, in their words.">
        <Textarea name="pain_points" rows={3} defaultValue={product?.pain_points ?? ""} />
      </Field>

      <Field label="Current offer" className="md:col-span-2">
        <Input name="offer" defaultValue={product?.offer ?? ""} placeholder="Bundle and save 15%" />
      </Field>

      {state && !state.ok && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:col-span-2">
          Saved.
        </p>
      )}

      <div className="flex items-center gap-2 md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : product ? "Save product" : "Add product"}
        </Button>
        {onDone}
      </div>
    </form>
  );
}
