import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  LinkButton,
  PageHeader,
  Select,
  TagList,
  Table,
  Td,
  Th,
  buttonClass,
} from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { CONTENT_STATUSES, contentStatus } from "@/lib/constants";
import { pct, roas, shortDate, shortNum, usd } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ContentWithRelations, Creator } from "@/lib/types";

export const metadata = { title: "Content · Content CRM" };

const SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "due", label: "Due date" },
  { value: "posted", label: "Post date" },
  { value: "views", label: "Views" },
] as const;

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; creator?: string; sort?: string }>;
}) {
  const { q, status, creator, sort = "updated" } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("content")
    .select(
      "*, creator:creators(id, name, handle), product:products(id, name), owner:profiles(id, full_name)",
    );

  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (creator) query = query.eq("creator_id", creator);

  if (sort === "due") query = query.order("due_date", { ascending: true, nullsFirst: false });
  else if (sort === "posted") query = query.order("post_date", { ascending: false, nullsFirst: false });
  else if (sort === "views") query = query.order("views", { ascending: false, nullsFirst: false });
  else query = query.order("updated_at", { ascending: false });

  const [{ data: rows }, { data: creatorRows }] = await Promise.all([
    query.limit(300),
    supabase.from("creators").select("id, name").order("name"),
  ]);

  const items = (rows ?? []) as unknown as ContentWithRelations[];
  const creators = (creatorRows ?? []) as Pick<Creator, "id" | "name">[];
  const filtered = Boolean(q || status || creator);

  return (
    <>
      <PageHeader
        title="Content"
        subtitle={`${items.length} ${items.length === 1 ? "record" : "records"}${filtered ? " matching your filters" : ""}`}
        actions={
          <>
            <LinkButton href="/pipeline" variant="secondary">
              Board view
            </LinkButton>
            {canWrite(profile) && <LinkButton href="/content/new">New content</LinkButton>}
          </>
        }
      />

      <Card className="mb-5 p-3">
        <form className="flex flex-wrap items-end gap-2">
          <label className="min-w-48 flex-1">
            <span className="mb-1.5 block text-xs font-medium text-ink-600">Search title</span>
            <Input name="q" defaultValue={q ?? ""} placeholder="serum, unboxing, hook test…" />
          </label>

          <label className="w-44">
            <span className="mb-1.5 block text-xs font-medium text-ink-600">Stage</span>
            <Select name="status" defaultValue={status ?? ""}>
              <option value="">All stages</option>
              {CONTENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="w-44">
            <span className="mb-1.5 block text-xs font-medium text-ink-600">Creator</span>
            <Select name="creator" defaultValue={creator ?? ""}>
              <option value="">All creators</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="w-44">
            <span className="mb-1.5 block text-xs font-medium text-ink-600">Sort</span>
            <Select name="sort" defaultValue={sort}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>

          <button type="submit" className={buttonClass("secondary")}>
            Apply
          </button>
          {filtered && (
            <Link href="/content" className={buttonClass("ghost")}>
              Clear
            </Link>
          )}
        </form>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState
            title={filtered ? "Nothing matches those filters" : "No content yet"}
            body={
              filtered
                ? "Try a broader search or clear the filters."
                : "Add your first piece and it will appear on the board."
            }
            action={
              canWrite(profile) && !filtered ? (
                <LinkButton href="/content/new">New content</LinkButton>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Stage</Th>
                <Th>Creator</Th>
                <Th>Product</Th>
                <Th>Formats</Th>
                <Th align="right">Due</Th>
                <Th align="right">Posted</Th>
                <Th align="right">Views</Th>
                <Th align="right">Eng.</Th>
                <Th align="right">Spend</Th>
                <Th align="right">ROAS</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const stage = contentStatus(item.status);
                return (
                  <tr key={item.id} className="hover:bg-ink-50">
                    <Td className="max-w-72">
                      <Link
                        href={`/content/${item.id}`}
                        className="font-medium text-ink-900 hover:text-violet-700"
                      >
                        {item.title}
                      </Link>
                      {item.usage !== "organic" && (
                        <span className="ml-1.5 text-[11px] text-sky-700">
                          {item.usage === "paid" ? "paid" : "+paid"}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={stage.tone}>{stage.label}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-600">
                      {item.creator ? (
                        <Link
                          href={`/creators/${item.creator.id}`}
                          className="hover:text-violet-700"
                        >
                          {item.creator.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-600">{item.product?.name ?? "—"}</Td>
                    <Td>
                      <TagList items={item.formats} max={2} />
                    </Td>
                    <Td align="right" className="whitespace-nowrap text-ink-600">
                      {shortDate(item.due_date)}
                    </Td>
                    <Td align="right" className="whitespace-nowrap text-ink-600">
                      {shortDate(item.post_date)}
                    </Td>
                    <Td align="right">{shortNum(item.views)}</Td>
                    <Td align="right" className="text-ink-600">
                      {pct(item.engagement_rate)}
                    </Td>
                    <Td align="right" className="text-ink-600">
                      {usd(item.ad_spend)}
                    </Td>
                    <Td align="right" className="font-medium">
                      {roas(item.roas)}
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
