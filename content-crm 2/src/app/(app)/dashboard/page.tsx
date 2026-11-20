import Link from "next/link";
import { FormatPerformance, SpendRevenueTrend, ViewsTrend } from "@/components/charts";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  PageHeader,
  StatTile,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatPerformance, weeklySeries } from "@/lib/aggregate";
import { requireProfile } from "@/lib/auth";
import {
  ACTIVE_CONTENT_STATUSES,
  BOARD_STATUSES,
  contentStatus,
  creatorStatus,
} from "@/lib/constants";
import { daysUntil, relativeDays, roas, shortDate, shortNum, usd } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ContentWithRelations, Creator } from "@/lib/types";

const CONTENT_SELECT = `
  *,
  creator:creators ( id, name, handle ),
  product:products ( id, name ),
  owner:profiles ( id, full_name )
`;

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: contentRows }, { data: creatorRows }] = await Promise.all([
    supabase
      .from("content")
      .select(CONTENT_SELECT)
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase.from("creators").select("*").order("name"),
  ]);

  const content = (contentRows ?? []) as unknown as ContentWithRelations[];
  const creators = (creatorRows ?? []) as Creator[];

  // --- Pipeline -------------------------------------------------------------
  const inPipeline = content.filter((c) => ACTIVE_CONTENT_STATUSES.includes(c.status));
  const byStatus = new Map<string, number>();
  for (const item of content) {
    byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1);
  }

  // --- Posted in the last 30 days ------------------------------------------
  const postedRecently = content.filter((c) => {
    const days = daysUntil(c.post_date);
    return c.status === "posted" && days !== null && days <= 0 && days >= -30;
  });

  const viewsLast30 = postedRecently.reduce((sum, c) => sum + (c.views ?? 0), 0);

  // --- Paid performance ----------------------------------------------------
  const paid = content.filter((c) => c.usage === "paid" || c.usage === "both");
  const spend = paid.reduce((sum, c) => sum + (c.ad_spend ?? 0), 0);
  const revenue = paid.reduce((sum, c) => sum + (c.revenue ?? 0), 0);
  const blendedRoas = spend > 0 ? revenue / spend : null;

  // --- Things that need attention ------------------------------------------
  const dueSoon = inPipeline
    .filter((c) => {
      const days = daysUntil(c.due_date);
      return days !== null && days <= 7;
    })
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  const rightsExpiring = content
    .filter((c) => {
      const days = daysUntil(c.rights_expire_on);
      return days !== null && days <= 30;
    })
    .sort((a, b) => (a.rights_expire_on ?? "").localeCompare(b.rights_expire_on ?? ""));

  const topPerformers = content
    .filter((c) => c.status === "posted" && c.views !== null)
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5);

  // --- Chart series --------------------------------------------------------
  const weekly = weeklySeries(content, 12);
  const byFormat = formatPerformance(content);

  const activeCreators = creators.filter((c) => c.status === "active");
  const creatorsInTalks = creators.filter(
    (c) => c.status === "outreach_sent" || c.status === "negotiating",
  );

  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const maxInStatus = Math.max(1, ...BOARD_STATUSES.map((s) => byStatus.get(s.value) ?? 0));

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle="Where the content stands today."
        actions={
          <>
            <LinkButton href="/pipeline" variant="secondary">
              Open board
            </LinkButton>
            <LinkButton href="/content/new">New content</LinkButton>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="In the pipeline"
          value={String(inPipeline.length)}
          footnote={`${dueSoon.length} due within a week`}
        />
        <StatTile
          label="Posted, last 30 days"
          value={String(postedRecently.length)}
          footnote={`${shortNum(viewsLast30)} views`}
        />
        <StatTile
          label="Blended ROAS"
          value={roas(blendedRoas)}
          footnote={`${usd(spend)} spend · ${usd(revenue)} revenue`}
        />
        <StatTile
          label="Rights expiring"
          value={String(rightsExpiring.length)}
          footnote="Within 30 days"
          tone={rightsExpiring.length > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ViewsTrend data={weekly} />
        <SpendRevenueTrend data={weekly} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Pipeline shape ---------------------------------------------------- */}
        <Card className="lg:col-span-1">
          <CardHeader title="Pipeline by stage" action={<Link href="/pipeline" className="text-xs text-violet-700 hover:underline">Board</Link>} />
          <div className="space-y-2.5 px-5 py-4">
            {BOARD_STATUSES.map((status) => {
              const count = byStatus.get(status.value) ?? 0;
              return (
                <div key={status.value} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-ink-600">
                    {status.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-ink-800"
                      style={{ width: `${(count / maxInStatus) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-900">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Due soon --------------------------------------------------------- */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs attention"
            description="Overdue or due in the next seven days."
            action={
              <Link href="/content" className="text-xs text-violet-700 hover:underline">
                All content
              </Link>
            }
          />
          {dueSoon.length === 0 ? (
            <EmptyState
              title="Nothing is due this week"
              body="Set due dates on pipeline items and they will show up here."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Stage</Th>
                  <Th>Creator</Th>
                  <Th align="right">Due</Th>
                </tr>
              </thead>
              <tbody>
                {dueSoon.slice(0, 7).map((item) => {
                  const overdue = (daysUntil(item.due_date) ?? 0) < 0;
                  const status = contentStatus(item.status);
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
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </Td>
                      <Td className="text-ink-600">{item.creator?.name ?? "—"}</Td>
                      <Td align="right">
                        <span className={overdue ? "font-medium text-rose-700" : "text-ink-600"}>
                          {relativeDays(item.due_date)}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Top performers --------------------------------------------------- */}
        <Card className="lg:col-span-2">
          <CardHeader title="Top performers" description="Most viewed posted content." />
          {topPerformers.length === 0 ? (
            <EmptyState
              title="No performance data yet"
              body="Add views, likes and comments to posted content to see what is working."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Product</Th>
                  <Th align="right">Views</Th>
                  <Th align="right">ROAS</Th>
                  <Th align="right">Posted</Th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-50">
                    <Td>
                      <Link
                        href={`/content/${item.id}`}
                        className="font-medium text-ink-900 hover:text-violet-700"
                      >
                        {item.title}
                      </Link>
                    </Td>
                    <Td className="text-ink-600">{item.product?.name ?? "—"}</Td>
                    <Td align="right">{shortNum(item.views)}</Td>
                    <Td align="right">{roas(item.roas)}</Td>
                    <Td align="right" className="text-ink-600">
                      {shortDate(item.post_date)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Roster ----------------------------------------------------------- */}
        <Card>
          <CardHeader
            title="Roster"
            action={
              <Link href="/creators" className="text-xs text-violet-700 hover:underline">
                Manage
              </Link>
            }
          />
          <div className="px-5 py-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-ink-900">
                {activeCreators.length}
              </span>
              <span className="text-sm text-ink-400">active</span>
            </div>
            <p className="mt-1 text-xs text-ink-400">
              {creatorsInTalks.length} in outreach or negotiation
            </p>

            <ul className="mt-4 space-y-2">
              {creators.slice(0, 5).map((creator) => {
                const status = creatorStatus(creator.status);
                return (
                  <li key={creator.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/creators/${creator.id}`}
                      className="truncate text-sm text-ink-800 hover:text-violet-700"
                    >
                      {creator.name}
                    </Link>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </li>
                );
              })}
            </ul>

            {creators.length === 0 && (
              <p className="mt-3 text-sm text-ink-400">No creators on the roster yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <FormatPerformance data={byFormat} />
      </div>

      {rightsExpiring.length > 0 && (
        <Card className="mt-5">
          <CardHeader
            title="Usage rights running out"
            description="Pull these from paid campaigns, or renew the licence with the creator."
          />
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Creator</Th>
                <Th>Running as</Th>
                <Th align="right">Expires</Th>
              </tr>
            </thead>
            <tbody>
              {rightsExpiring.map((item) => {
                const days = daysUntil(item.rights_expire_on) ?? 0;
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
                    <Td className="text-ink-600">{item.creator?.name ?? "—"}</Td>
                    <Td className="text-ink-600 capitalize">{item.usage}</Td>
                    <Td align="right">
                      <span className={days < 0 ? "font-medium text-rose-700" : "text-amber-700"}>
                        {shortDate(item.rights_expire_on)} · {relativeDays(item.rights_expire_on)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
