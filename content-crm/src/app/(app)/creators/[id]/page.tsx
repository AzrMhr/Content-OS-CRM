import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCreator, logCreatorContact } from "@/app/actions/creators";
import { ConfirmSubmit, SubmitButton } from "@/components/confirm-submit";
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
  Table,
  Td,
  Th,
} from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import {
  DEAL_TYPES,
  USAGE_RIGHTS,
  contentStatus,
  creatorStatus,
  labelOf,
} from "@/lib/constants";
import { num, pct, relativeDays, roas, shortDate, shortNum, usd, usdExact } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Content, Creator } from "@/lib/types";

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: creator }, { data: contentRows }] = await Promise.all([
    supabase.from("creators").select("*").eq("id", id).maybeSingle<Creator>(),
    supabase
      .from("content")
      .select("*")
      .eq("creator_id", id)
      .order("post_date", { ascending: false, nullsFirst: false }),
  ]);

  if (!creator) notFound();

  const content = (contentRows ?? []) as Content[];
  const stage = creatorStatus(creator.status);
  const writable = canWrite(profile);

  const posted = content.filter((c) => c.status === "posted");
  const totalViews = posted.reduce((sum, c) => sum + (c.views ?? 0), 0);
  const spend = content.reduce((sum, c) => sum + (c.ad_spend ?? 0), 0);
  const revenue = content.reduce((sum, c) => sum + (c.revenue ?? 0), 0);
  const avgEngagement =
    posted.filter((c) => c.engagement_rate !== null).length > 0
      ? posted.reduce((sum, c) => sum + (c.engagement_rate ?? 0), 0) /
        posted.filter((c) => c.engagement_rate !== null).length
      : null;

  // Rough cost per thousand views, the number that decides who gets rebooked.
  const paidOut = creator.rate_per_video ? creator.rate_per_video * content.length : null;
  const cpm = paidOut && totalViews > 0 ? (paidOut / totalViews) * 1000 : null;

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <Link href="/creators" className="text-xs text-ink-400 hover:text-ink-900">
          ← Roster
        </Link>
      </div>

      <PageHeader
        title={creator.name}
        subtitle={creator.handle ?? undefined}
        actions={
          writable ? (
            <>
              <form action={logCreatorContact}>
                <input type="hidden" name="id" value={creator.id} />
                <SubmitButton variant="secondary">Log contact today</SubmitButton>
              </form>
              <LinkButton href={`/creators/${creator.id}/edit`} variant="secondary">
                Edit
              </LinkButton>
              <form action={deleteCreator}>
                <input type="hidden" name="id" value={creator.id} />
                <ConfirmSubmit
                  size="md"
                  message={`Remove ${creator.name} from the roster? Their content records stay, but lose the link.`}
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
        {creator.rating && (
          <span className="text-xs text-amber-600">{"★".repeat(creator.rating)}</span>
        )}
        {creator.last_contacted && (
          <span className="text-xs text-ink-400">
            Last contact {relativeDays(creator.last_contacted)}
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Performance" description="Across everything they have made for you." />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3">
              <Metric label="Pieces made" value={String(content.length)} />
              <Metric label="Posted" value={String(posted.length)} />
              <Metric label="Total views" value={shortNum(totalViews)} />
              <Metric label="Avg engagement" value={pct(avgEngagement, 2)} />
              <Metric label="Ad spend" value={usd(spend)} />
              <Metric label="ROAS" value={roas(spend > 0 ? revenue / spend : null)} />
              {cpm !== null && <Metric label="Cost per 1K views" value={usdExact(cpm)} />}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Their content"
              action={
                writable ? (
                  <Link href="/content/new" className="text-xs text-violet-700 hover:underline">
                    New piece
                  </Link>
                ) : undefined
              }
            />
            {content.length === 0 ? (
              <EmptyState
                title="Nothing booked yet"
                body="Create a content record and assign it to this creator."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Title</Th>
                    <Th>Stage</Th>
                    <Th align="right">Posted</Th>
                    <Th align="right">Views</Th>
                    <Th align="right">ROAS</Th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => {
                    const itemStage = contentStatus(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-ink-50">
                        <Td>
                          <Link
                            href={`/content/${item.id}`}
                            className="font-medium text-ink-900 hover:text-violet-700"
                          >
                            {item.title}
                          </Link>
                        </Td>
                        <Td>
                          <Badge tone={itemStage.tone}>{itemStage.label}</Badge>
                        </Td>
                        <Td align="right" className="whitespace-nowrap text-ink-600">
                          {shortDate(item.post_date)}
                        </Td>
                        <Td align="right">{shortNum(item.views)}</Td>
                        <Td align="right">{roas(item.roas)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          {creator.notes && (
            <Card>
              <CardHeader title="Notes" />
              <p className="whitespace-pre-wrap px-5 py-4 text-sm text-ink-800">{creator.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Contact" />
            <dl>
              <DetailRow label="Email">
                {creator.email ? (
                  <a
                    href={`mailto:${creator.email}`}
                    className="text-violet-700 hover:underline"
                  >
                    {creator.email}
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Profile">
                <ExternalLink href={creator.profile_url} label={creator.handle ?? "Open"} />
              </DetailRow>
              <DetailRow label="Followers">{num(creator.followers)}</DetailRow>
              <DetailRow label="Platforms">
                <TagList items={creator.platforms} max={4} />
              </DetailRow>
              <DetailRow label="Niches">
                <TagList items={creator.niches} max={4} />
              </DetailRow>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Deal" />
            <dl>
              <DetailRow label="Type">{labelOf(DEAL_TYPES, creator.deal)}</DetailRow>
              <DetailRow label="Rate per video">{usdExact(creator.rate_per_video)}</DetailRow>
              <DetailRow label="Usage rights">{labelOf(USAGE_RIGHTS, creator.rights)}</DetailRow>
              <DetailRow label="Last contacted">{shortDate(creator.last_contacted)}</DetailRow>
            </dl>
          </Card>
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
