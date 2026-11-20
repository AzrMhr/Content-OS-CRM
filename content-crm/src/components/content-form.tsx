"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createContent, updateContent } from "@/app/actions/content";
import { CheckboxGroup } from "@/components/checkbox-group";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
  buttonClass,
} from "@/components/ui";
import {
  CONTENT_FORMATS,
  CONTENT_GOALS,
  CONTENT_STATUSES,
  CONTENT_USAGES,
  PLATFORMS,
} from "@/lib/constants";
import type { ActionResult, Content } from "@/lib/types";

type Option = { id: string; name: string };

export function ContentForm({
  content,
  creators,
  products,
  team,
  disabled,
}: {
  content?: Content;
  creators: Option[];
  products: Option[];
  team: Option[];
  disabled?: boolean;
}) {
  const isEdit = Boolean(content);
  const action = isEdit ? updateContent : createContent;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {content && <input type="hidden" name="id" value={content.id} />}

      <Card>
        <CardHeader title="The piece" />
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2">
            <Input
              name="title"
              required
              defaultValue={content?.title ?? ""}
              placeholder="Maya — 30 day serum results"
              disabled={disabled}
            />
          </Field>

          <Field label="Stage">
            <Select name="status" defaultValue={content?.status ?? "idea"} disabled={disabled}>
              {CONTENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Goal">
            <Select name="goal" defaultValue={content?.goal ?? ""} disabled={disabled}>
              <option value="">Not set</option>
              {CONTENT_GOALS.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Creator">
            <Select name="creator_id" defaultValue={content?.creator_id ?? ""} disabled={disabled}>
              <option value="">Unassigned</option>
              {creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Product">
            <Select name="product_id" defaultValue={content?.product_id ?? ""} disabled={disabled}>
              <option value="">None</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Owner on the team">
            <Select name="owner_id" defaultValue={content?.owner_id ?? ""} disabled={disabled}>
              <option value="">Unassigned</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Running as">
            <Select name="usage" defaultValue={content?.usage ?? "organic"} disabled={disabled}>
              {CONTENT_USAGES.map((usage) => (
                <option key={usage.value} value={usage.value}>
                  {usage.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Formats" className="md:col-span-2">
            <CheckboxGroup
              name="formats"
              options={CONTENT_FORMATS}
              defaultValues={content?.formats ?? []}
              disabled={disabled}
            />
          </Field>

          <Field label="Platforms" className="md:col-span-2">
            <CheckboxGroup
              name="platforms"
              options={PLATFORMS}
              defaultValues={content?.platforms ?? []}
              disabled={disabled}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Brief" description="What the creator receives." />
        <div className="grid gap-4 px-5 py-4">
          <Field label="Hook" hint="The first three seconds. One line.">
            <Input
              name="hook"
              defaultValue={content?.hook ?? ""}
              placeholder="I took a photo every morning for 30 days and did not expect this"
              disabled={disabled}
            />
          </Field>

          <Field label="Brief" hint="Must-say points, words to avoid, tone, deliverables.">
            <Textarea
              name="brief"
              rows={4}
              defaultValue={content?.brief ?? ""}
              disabled={disabled}
            />
          </Field>

          <Field label="Shot list">
            <Textarea
              name="shot_list"
              rows={3}
              defaultValue={content?.shot_list ?? ""}
              placeholder="Unboxing, close on texture, product in use, end card"
              disabled={disabled}
            />
          </Field>

          <Field label="Caption">
            <Textarea
              name="caption"
              rows={2}
              defaultValue={content?.caption ?? ""}
              disabled={disabled}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Dates and links" />
        <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
          <Field label="Due date">
            <Input
              type="date"
              name="due_date"
              defaultValue={content?.due_date ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Post date">
            <Input
              type="date"
              name="post_date"
              defaultValue={content?.post_date ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Rights expire" hint="Leave blank for perpetual or organic only.">
            <Input
              type="date"
              name="rights_expire_on"
              defaultValue={content?.rights_expire_on ?? ""}
              disabled={disabled}
            />
          </Field>

          <Field label="Raw footage">
            <Input
              type="url"
              name="raw_footage_url"
              defaultValue={content?.raw_footage_url ?? ""}
              placeholder="https://drive.google.com/…"
              disabled={disabled}
            />
          </Field>
          <Field label="Edited cut">
            <Input
              type="url"
              name="edited_url"
              defaultValue={content?.edited_url ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Live post">
            <Input
              type="url"
              name="live_url"
              defaultValue={content?.live_url ?? ""}
              disabled={disabled}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Results"
          description="ROAS and engagement rate are calculated for you."
        />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Views">
            <Input
              type="number"
              min={0}
              name="views"
              defaultValue={content?.views ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Likes">
            <Input
              type="number"
              min={0}
              name="likes"
              defaultValue={content?.likes ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Comments">
            <Input
              type="number"
              min={0}
              name="comments"
              defaultValue={content?.comments ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Ad spend">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="ad_spend"
              defaultValue={content?.ad_spend ?? ""}
              disabled={disabled}
            />
          </Field>
          <Field label="Revenue">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="revenue"
              defaultValue={content?.revenue ?? ""}
              disabled={disabled}
            />
          </Field>
        </div>
      </Card>

      {state && !state.ok && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}
      {state?.ok && isEdit && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || disabled}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create content"}
        </Button>
        <Link
          href={content ? `/content/${content.id}` : "/content"}
          className={buttonClass("secondary")}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
