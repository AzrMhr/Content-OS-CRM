import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  StatTile,
  TagList,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { CREATOR_STATUSES, DEAL_TYPES, USAGE_RIGHTS, creatorStatus, labelOf } from "@/lib/constants";
import { shortDate, shortNum, usd } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Creator } from "@/lib/types";

export const metadata = { title: "Creators · Content CRM" };

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase.from("creators").select("*");
  if (status) query = query.eq("status", status);

  const [{ data: rows }, { data: counts }] = await Promise.all([
    query.order("name"),
    supabase.from("creators").select("status"),
  ]);

  const creators = (rows ?? []) as Creator[];
  const allStatuses = (counts ?? []) as { status: Creator["status"] }[];

  const active = allStatuses.filter((c) => c.status === "active").length;
  const inTalks = allStatuses.filter(
    (c) => c.status === "outreach_sent" || c.status === "negotiating",
  ).length;
  const prospects = allStatuses.filter((c) => c.status === "prospect").length;
  const avgRate =
    creators.filter((c) => c.rate_per_video).length > 0
      ? creators.reduce((sum, c) => sum + (c.rate_per_video ?? 0), 0) /
        creators.filter((c) => c.rate_per_video).length
      : null;

  return (
    <>
      <PageHeader
        title="Creators"
        subtitle="The roster, and where each relationship stands."
        actions={canWrite(profile) ? <LinkButton href="/creators/new">Add creator</LinkButton> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active" value={String(active)} />
        <StatTile label="In talks" value={String(inTalks)} footnote="Outreach or negotiating" />
        <StatTile label="Prospects" value={String(prospects)} footnote="Not contacted yet" />
        <StatTile label="Average rate" value={usd(avgRate)} footnote="Per video, where set" />
      </div>

      <div className="my-5 flex flex-wrap gap-1.5">
        <Link
          href="/creators"
          className={`rounded-md px-2.5 py-1 text-xs ${!status ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"}`}
        >
          All
        </Link>
        {CREATOR_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/creators?status=${s.value}`}
            className={`rounded-md px-2.5 py-1 text-xs ${status === s.value ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <Card>
        {creators.length === 0 ? (
          <EmptyState
            title={status ? "No creators at this stage" : "No creators yet"}
            body="Add the people you work with, plus the ones you want to reach out to."
            action={
              canWrite(profile) ? <LinkButton href="/creators/new">Add creator</LinkButton> : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Creator</Th>
                <Th>Stage</Th>
                <Th>Niches</Th>
                <Th>Platforms</Th>
                <Th align="right">Followers</Th>
                <Th>Deal</Th>
                <Th align="right">Rate</Th>
                <Th>Rights</Th>
                <Th align="right">Last contact</Th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => {
                const stage = creatorStatus(creator.status);
                return (
                  <tr key={creator.id} className="hover:bg-ink-50">
                    <Td>
                      <Link
                        href={`/creators/${creator.id}`}
                        className="font-medium text-ink-900 hover:text-violet-700"
                      >
                        {creator.name}
                      </Link>
                      {creator.handle && (
                        <span className="ml-1.5 text-xs text-ink-400">{creator.handle}</span>
                      )}
                      {creator.rating && (
                        <span className="ml-1.5 text-xs text-amber-600">
                          {"★".repeat(creator.rating)}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={stage.tone}>{stage.label}</Badge>
                    </Td>
                    <Td>
                      <TagList items={creator.niches} max={2} />
                    </Td>
                    <Td>
                      <TagList items={creator.platforms} max={3} />
                    </Td>
                    <Td align="right">{shortNum(creator.followers)}</Td>
                    <Td className="whitespace-nowrap text-ink-600">
                      {labelOf(DEAL_TYPES, creator.deal)}
                    </Td>
                    <Td align="right">{usd(creator.rate_per_video)}</Td>
                    <Td className="whitespace-nowrap text-ink-600">
                      {labelOf(USAGE_RIGHTS, creator.rights)}
                    </Td>
                    <Td align="right" className="whitespace-nowrap text-ink-600">
                      {shortDate(creator.last_contacted)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
