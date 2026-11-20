import { NextResponse, type NextRequest } from "next/server";
import { contentStatus, creatorStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type SearchGroup = {
  label: string;
  items: SearchItem[];
};

/**
 * Backs the command palette. Row level security applies through the user's own
 * session, so this returns nothing to a signed-out caller and only what the
 * person is allowed to read.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ groups: [] satisfies SearchGroup[] }, { status: 401 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  // Escape the wildcards so a stray % does not match everything.
  const pattern = `%${query.replace(/[%_]/g, (char) => `\\${char}`)}%`;

  const contentQuery = supabase
    .from("content")
    .select("id, title, status, creator:creators(name)")
    .order("updated_at", { ascending: false })
    .limit(6);

  const creatorQuery = supabase
    .from("creators")
    .select("id, name, handle, status")
    .order("name")
    .limit(6);

  const productQuery = supabase.from("products").select("id, name, category").order("name").limit(6);

  const [content, creators, products] = await Promise.all([
    query ? contentQuery.ilike("title", pattern) : contentQuery,
    query ? creatorQuery.ilike("name", pattern) : creatorQuery,
    query ? productQuery.ilike("name", pattern) : productQuery,
  ]);

  const groups: SearchGroup[] = [];

  const contentRows = (content.data ?? []) as unknown as {
    id: string;
    title: string;
    status: Parameters<typeof contentStatus>[0];
    creator: { name: string } | null;
  }[];

  if (contentRows.length) {
    groups.push({
      label: "Content",
      items: contentRows.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: [contentStatus(row.status).label, row.creator?.name].filter(Boolean).join(" · "),
        href: `/content/${row.id}`,
      })),
    });
  }

  const creatorRows = (creators.data ?? []) as unknown as {
    id: string;
    name: string;
    handle: string | null;
    status: Parameters<typeof creatorStatus>[0];
  }[];

  if (creatorRows.length) {
    groups.push({
      label: "Creators",
      items: creatorRows.map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: [creatorStatus(row.status).label, row.handle].filter(Boolean).join(" · "),
        href: `/creators/${row.id}`,
      })),
    });
  }

  const productRows = (products.data ?? []) as unknown as {
    id: string;
    name: string;
    category: string | null;
  }[];

  if (productRows.length) {
    groups.push({
      label: "Products",
      items: productRows.map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: row.category ?? "Product",
        href: "/products",
      })),
    });
  }

  return NextResponse.json({ groups });
}
