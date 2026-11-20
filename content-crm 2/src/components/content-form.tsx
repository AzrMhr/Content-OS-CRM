"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createContent, updateContent } from "@/app/actions/content";
import { BriefGenerator } from "@/components/brief-generator";
import { CheckboxGroup } from "@/components/checkbox-group";
import { PostPreview } from "@/components/post-preview";
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
  CONTENT_FORMATS,
  CONTENT_GOALS,
  CONTENT_STATUSES,
  CONTENT_USAGES,
  PLATFORMS,
} from "@/lib/constants";
import type { ActionResult, Content } from "@/lib/types";
import { useSuccessToast } from "@/lib/use-success-toast";

type Option = { id: string; name: string };
type CreatorOption = Option & { handle?: string | null };

export function ContentForm({
  content,
  creators,
  products,
  team,
  disabled,
}: {
  content?: Content;
  creators: CreatorOption[];
  products: Option[];
  team: Option[];
  disabled?: boolean;
}) {
  const isEdit = Boolean(content);
  const action = isEdit ? updateContent : createContent;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  useSuccessToast(state, isEdit ? "Changes saved" : "Content created");

  // These fields are controlled so the preview updates as you type and the AI
  // draft can write into them.
  const [title, setTitle] = useState(content?.title ?? "");
  const [creatorId, setCreatorId] = useState(content?.creator_id ?? "");
  const [productId, setProductId] = useState(content?.product_id ?? "");
  const [goal, setGoal] = useState<string>(content?.goal ?? "");
  const [formats, setFormats] = useState<string[]>(content?.formats ?? []);
  const [platforms, setPlatforms] = useState<string[]>(content?.platforms ?? []);
  const [hook, setHook] = useState(content?.hook ?? "");
  const [brief, setBrief] = useState(content?.brief ?? "");
  const [shotList, setShotList] = useState(content?.shot_list ?? "");
  const [caption, setCaption] = useState(content?.caption ?? "");

  const creator = creators.find((c) => c.id === creatorId);
  const product = products.find((p) => p.id === productId);

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
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
            <Select
              name="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={disabled}
            >
              <option value="">Not set</option>
              {CONTENT_GOALS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Creator">
            <Select
              name="creator_id"
              value={creatorId}
              onChange={(event) => setCreatorId(event.target.value)}
              disabled={disabled}
            >
              <option value="">Unassigned</option>
              {creators.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Product">
            <Select
              name="product_id"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              disabled={disabled}
            >
              <option value="">None</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
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
              value={formats}
              onChange={setFormats}
              disabled={disabled}
            />
          </Field>

          <Field label="Platforms" className="md:col-span-2">
            <CheckboxGroup
              name="platforms"
              options={PLATFORMS}
              value={platforms}
              onChange={setPlatforms}
              disabled={disabled}
            />
          </Field>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader
            title="Brief"
            description="What the creator receives."
            action={
              !disabled ? (
                <BriefGenerator
                  context={{
                    title,
                    productId: productId || null,
                    creatorId: creatorId || null,
                    formats,
                    platforms,
                    goal: goal || null,
                  }}
                  onUseHook={setHook}
                  onUseBrief={setBrief}
                  onUseShotList={setShotList}
                  onUseCaption={setCaption}
                />
              ) : undefined
            }
          />
          <div className="grid gap-4 px-5 py-4">
            <Field label="Hook" hint="The first three seconds. Under 60 characters reads well.">
              <Input
                name="hook"
                value={hook}
                onChange={(event) => setHook(event.target.value)}
                placeholder="I took a photo every morning for 30 days and did not expect this"
                disabled={disabled}
              />
            </Field>

            <Field label="Brief" hint="Must-say points, words to avoid, tone, deliverables.">
              <Textarea
                name="brief"
                rows={5}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                disabled={disabled}
              />
            </Field>

            <Field label="Shot list">
              <Textarea
                name="shot_list"
                rows={4}
                value={shotList}
                onChange={(event) => setShotList(event.target.value)}
                placeholder="Unboxing, close on texture, product in use, end card"
                disabled={disabled}
              />
            </Field>

            <Field label="Caption">
              <Textarea
                name="caption"
                rows={3}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                disabled={disabled}
              />
            </Field>
          </div>
        </Card>

        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader title="Preview" description="How the hook and caption land." />
          <div className="px-4 py-4">
            <PostPreview
              hook={hook}
              caption={caption}
              creatorHandle={creator?.handle ?? null}
              productName={product?.name ?? null}
            />
          </div>
        </Card>
      </div>

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

      {state && !state.ok && <Note>{state.error}</Note>}

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
