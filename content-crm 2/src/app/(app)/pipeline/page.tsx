import { Board, type BoardCard } from "@/components/board";
import { LinkButton, PageHeader } from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pipeline · Content CRM" };

type Row = {
  id: string;
  title: string;
  status: BoardCard["status"];
  formats: string[];
  usage: string;
  due_date: string | null;
  board_position: number;
  creator: { name: string } | null;
  product: { name: string } | null;
};

export default async function PipelinePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("content")
    .select("id, title, status, formats, usage, due_date, board_position, creator:creators(name), product:products(name)")
    .neq("status", "archived")
    .order("board_position")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  const cards: BoardCard[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    formats: row.formats ?? [],
    usage: row.usage,
    dueDate: row.due_date,
    creatorName: row.creator?.name ?? null,
    productName: row.product?.name ?? null,
  }));

  const writable = canWrite(profile);

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle={
          writable
            ? "Drag a card to another stage, or use the dropdown on the card."
            : "Read-only view of the content pipeline."
        }
        actions={
          <>
            <LinkButton href="/content" variant="secondary">
              Table view
            </LinkButton>
            {writable && <LinkButton href="/content/new">New content</LinkButton>}
          </>
        }
      />

      <Board cards={cards} canWrite={writable} />

      <p className="mt-4 text-xs text-ink-400">
        Archived items are hidden here. Find them under Content with the status filter.
      </p>
    </>
  );
}
