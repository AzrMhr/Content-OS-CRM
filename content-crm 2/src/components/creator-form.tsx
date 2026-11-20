"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCreator, updateCreator } from "@/app/actions/creators";
import { CheckboxGroup } from "@/components/checkbox-group";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Note,
  Select,
  Textarea,
  buttonClass,
} from "@/components/ui";
import {
  CREATOR_PLATFORMS,
  CREATOR_STATUSES,
  DEAL_TYPES,
  NICHES,
  USAGE_RIGHTS,
} from "@/lib/constants";
import type { ActionResult, Creator } from "@/lib/types";
import { useSuccessToast } from "@/lib/use-success-toast";

export function CreatorForm({ creator }: { creator?: Creator }) {
  const isEdit = Boolean(creator);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    isEdit ? updateCreator : createCreator,
    null,
  );
  useSuccessToast(state, isEdit ? "Creator saved" : "Creator added");

  return (
    <form action={formAction} className="space-y-5">
      {creator && <input type="hidden" name="id" value={creator.id} />}

      <Card>
        <CardHeader title="Who they are" />
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <Field label="Name">
            <Input name="name" required defaultValue={creator?.name ?? ""} placeholder="Maya Ortega" />
          </Field>

          <Field label="Relationship stage">
            <Select name="status" defaultValue={creator?.status ?? "prospect"}>
              {CREATOR_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Handle">
            <Input name="handle" defaultValue={creator?.handle ?? ""} placeholder="@mayadoesskin" />
          </Field>

          <Field label="Profile link">
            <Input
              type="url"
              name="profile_url"
              defaultValue={creator?.profile_url ?? ""}
              placeholder="https://tiktok.com/@…"
            />
          </Field>

          <Field label="Email">
            <Input type="email" name="email" defaultValue={creator?.email ?? ""} />
          </Field>

          <Field label="Followers">
            <Input type="number" min={0} name="followers" defaultValue={creator?.followers ?? ""} />
          </Field>

          <Field label="Niches" className="md:col-span-2">
            <CheckboxGroup name="niches" options={NICHES} defaultValues={creator?.niches ?? []} />
          </Field>

          <Field label="Platforms" className="md:col-span-2">
            <CheckboxGroup
              name="platforms"
              options={CREATOR_PLATFORMS}
              defaultValues={creator?.platforms ?? []}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="The deal" />
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <Field label="Deal type">
            <Select name="deal" defaultValue={creator?.deal ?? ""}>
              <option value="">Not agreed</option>
              {DEAL_TYPES.map((deal) => (
                <option key={deal.value} value={deal.value}>
                  {deal.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Rate per video">
            <Input
              type="number"
              min={0}
              step="0.01"
              name="rate_per_video"
              defaultValue={creator?.rate_per_video ?? ""}
            />
          </Field>

          <Field label="Usage rights" hint="What you are allowed to do with the footage.">
            <Select name="rights" defaultValue={creator?.rights ?? ""}>
              <option value="">Not agreed</option>
              {USAGE_RIGHTS.map((right) => (
                <option key={right.value} value={right.value}>
                  {right.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Rating" hint="Your own score, 1 to 5.">
            <Select name="rating" defaultValue={creator?.rating?.toString() ?? ""}>
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Last contacted">
            <Input type="date" name="last_contacted" defaultValue={creator?.last_contacted ?? ""} />
          </Field>

          <Field label="Notes" className="md:col-span-2" hint="Turnaround time, strengths, what to avoid.">
            <Textarea name="notes" rows={4} defaultValue={creator?.notes ?? ""} />
          </Field>
        </div>
      </Card>

      {state && !state.ok && <Note>{state.error}</Note>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add creator"}
        </Button>
        <Link
          href={creator ? `/creators/${creator.id}` : "/creators"}
          className={buttonClass("secondary")}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
