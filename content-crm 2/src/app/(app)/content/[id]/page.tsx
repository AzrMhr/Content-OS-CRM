import Link from "next/link";
import { notFound } from "next/navigation";
import { claimContent, deleteContent } from "@/app/actions/content";
import { ConfirmSubmit, SubmitButton } from "@/components/confirm-submit";
import { CopyButton } from "@/components/copy-button";
import { NoteForm } from "@/components/note-form";
import { PostPreview } from "@/components/post-preview";
import {
  Badge,
  Card,
  CardHeader,
  DetailRow,
  EmptyState,
  ExternalLink,
  LinkButton,
  PageHeader,
  TagList,
  buttonClass,
} from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import {
  CONTENT_GOALS,
  CONTENT_USAGES,
  contentStatus,
  labelOf,
} from "@/lib/constants";
import {
  dateTime,
  num,
  pct,
  relativeDays,
  roas,
  shortDate,
  shortNum,
  usdExact,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ContentActivity, ContentWithRelations } from "@/lib/types";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: row }, { data: activityRows }] = await Promise.all([
    supabase
      .from("content")
      .select(
        "*, creator:creators(id, name, handle), product:products(id, name), owner:profiles(id, full_name)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("content_activity")
      .select("*, actor:profiles(id, full_name)")
      .eq("content_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!row) notFound();

  const item = row as unknown as ContentWithRelations;
  const activity = (activityRows ?? []) as unknown as ContentActivity[];
  const stage = contentStatus(item.status);
  const writable = canWrite(profile);

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <Link href="/content" className="text-xs text-ink-400 hover:text-ink-900">
          ← All content
        </Link>
      </div>

      <PageHeader
        title={item.title}
        subtitle={`Last updated ${dateTime(item.updated_at)}`}
        actions={
          writable ? (
            <>
              <LinkButton href={`/content/${item.id}/edit`} variant="secondary">
                Edit
              </LinkButton>
              <form action={deleteContent}>
                <input type="hidden" name="id" value={item.id} />
                <ConfirmSubmit
                  size="md"
                  message={`Delete "${item.title}"? This cannot be undone.`}
                >
                  Delete
                </ConfirmSubmit>
              </form>
            </>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={stage.tone}>{stage.label}</Badge>
        <Badge tone={item.usage === "organic" ? "zinc" : "blue"}>
          {labelOf(CONTENT_USAGES, item.usage)}
        </Badge>
        {item.goal && <Badge tone="violet">{labelOf(CONTENT_GOALS, item.goal)}</Badge>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {item.hook && (
            <Card>
              <CardHeader
                title="Hook"
                action={<CopyButton value={item.hook} label="Hook" />}
              />
              <p className="px-5 py-4 text-lg font-medium leading-snug text-ink-900">
                “{item.hook}”
              </p>
            </Card>
          )}

          {(item.brief || item.shot_list || item.caption) && (
            <Card>
              <CardHeader title="Brief" />
              <div className="space-y-4 px-5 py-4 text-sm">
                {item.brief && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-ink-400">Direction</p>
                    <p className="whitespace-pre-wrap text-ink-800">{item.brief}</p>
                  </div>
                )}
                {item.shot_list && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-ink-400">Shot list</p>
                    <p className="whitespace-pre-wrap text-ink-800">{item.shot_list}</p>
                  </div>
                )}
                {item.caption && (
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-ink-400">Caption</p>
                      <CopyButton value={item.caption} label="Caption" />
                    </div>
                    <p className="whitespace-pre-wrap text-ink-800">{item.caption}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Results" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3">
              <Metric label="Views" value={shortNum(item.views)} />
              <Metric label="Likes" value={shortNum(item.likes)} />
              <Metric label="Comments" value={num(item.comments)} />
              <Metric label="Engagement rate" value={pct(item.engagement_rate, 2)} />
              <Metric label="Ad spend" value={usdExact(item.ad_spend)} />
              <Metric label="Revenue" value={usdExact(item.revenue)} />
              <Metric label="ROAS" value={roas(item.roas)} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Activity"
              description="Stage changes are logged automatically."
            />
            {writable && <NoteForm contentId={item.id} />}

            {activity.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <ol className="border-t border-ink-100">
                {activity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex gap-3 border-b border-ink-100 px-5 py-3 last:border-b-0"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-200" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-800">
                        {entry.kind === "created" && "Created"}
                        {entry.kind === "status_change" && (
                          <>
                            Moved from{" "}
                            <span className="font-medium">
                              {entry.from_status ? contentStatus(entry.from_status).label : "—"}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                              {entry.to_status ? contentStatus(entry.to_status).label : "—"}
                            </span>
                          </>
                        )}
                        {entry.kind === "note" && entry.note}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {entry.actor?.full_name ?? "System"} · {dateTime(entry.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          {(item.hook || item.caption) && (
            <Card>
              <CardHeader title="Preview" description="How this lands in the feed." />
              <div className="px-4 py-4">
                <PostPreview
                  hook={item.hook}
                  caption={item.caption}
                  creatorHandle={item.creator?.handle ?? null}
                  productName={item.product?.name ?? null}
                />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Details" />
            <dl>
              <DetailRow label="Creator">
                {item.creator ? (
                  <Link
                    href={`/creators/${item.creator.id}`}
                    className="text-violet-700 hover:underline"
                  >
                    {item.creator.name}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Product">{item.product?.name ?? "—"}</DetailRow>
              <DetailRow label="Owner">
                {item.owner?.full_name ?? (
                  writable ? (
                    <form action={claimContent} className="inline">
                      <input type="hidden" name="id" value={item.id} />
                      <SubmitButton variant="ghost" size="sm">
                        Claim
                      </SubmitButton>
                    </form>
                  ) : (
                    "—"
                  )
                )}
              </DetailRow>
              <DetailRow label="Formats">
                <TagList items={item.formats} max={6} />
              </DetailRow>
              <DetailRow label="Platforms">
                <TagList items={item.platforms} max={6} />
              </DetailRow>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Dates" />
            <dl>
              <DetailRow label="Due">
                {item.due_date ? (
                  <>
                    {shortDate(item.due_date)}
                    <span className="ml-1 text-ink-400">({relativeDays(item.due_date)})</span>
                  </>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Posted">{shortDate(item.post_date)}</DetailRow>
              <DetailRow label="Rights expire">
                {item.rights_expire_on ? (
                  <span
                    className={
                      (relativeDays(item.rights_expire_on) ?? "").includes("ago")
                        ? "text-rose-700"
                        : undefined
                    }
                  >
                    {shortDate(item.rights_expire_on)}
                  </span>
                ) : (
                  "—"
                )}
              </DetailRow>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Files and links" />
            <dl>
              <DetailRow label="Raw footage">
                <ExternalLink href={item.raw_footage_url} />
              </DetailRow>
              <DetailRow label="Edited cut">
                <ExternalLink href={item.edited_url} />
              </DetailRow>
              <DetailRow label="Live post">
                <ExternalLink href={item.live_url} label="View post" />
              </DetailRow>
            </dl>
          </Card>

          {writable && (
            <Link href={`/content/${item.id}/edit`} className={buttonClass("secondary")}>
              Edit this record
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink-900">{value}</p>
    </div>
  );
}
