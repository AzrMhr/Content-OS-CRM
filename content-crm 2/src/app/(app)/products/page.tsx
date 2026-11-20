import Link from "next/link";
import { deleteProduct } from "@/app/actions/products";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ProductForm } from "@/components/product-form";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { canWrite, requireProfile } from "@/lib/auth";
import { productPriority } from "@/lib/constants";
import { shortNum, usdExact } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const metadata = { title: "Products · Content CRM" };

type Row = Product & { content: { id: string; status: string; views: number | null }[] };

export default async function ProductsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, content(id, status, views)")
    .order("name");

  const products = (data ?? []) as unknown as Row[];
  const writable = canWrite(profile);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Products"
        subtitle="What the content is selling. Link a product to a piece and its coverage shows up here."
      />

      {writable && (
        <Card className="mb-5">
          <CardHeader title="Add a product" />
          <div className="px-5 py-4">
            <ProductForm />
          </div>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <EmptyState
            title="No products yet"
            body={
              writable
                ? "Add your first product above."
                : "An editor or admin can add products here."
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const priority = productPriority(product.priority);
            const pieces = product.content ?? [];
            const posted = pieces.filter((c) => c.status === "posted");
            const views = posted.reduce((sum, c) => sum + (c.views ?? 0), 0);

            return (
              <Card as="li" key={product.id}>
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-ink-900">{product.name}</h2>
                      <Badge tone={priority.tone}>{priority.label}</Badge>
                      {product.category && (
                        <span className="text-xs text-ink-400">{product.category}</span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-ink-600">
                      {usdExact(product.price)}
                      {product.offer && <span className="text-ink-400"> · {product.offer}</span>}
                    </p>

                    {product.benefits && (
                      <p className="mt-2 max-w-xl text-sm text-ink-600">{product.benefits}</p>
                    )}
                    {product.pain_points && (
                      <p className="mt-1 max-w-xl text-sm text-ink-400">
                        Pain points: {product.pain_points}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums text-ink-900">
                      {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
                    </p>
                    <p className="text-xs text-ink-400">
                      {posted.length} posted · {shortNum(views)} views
                    </p>
                    <Link
                      href={`/content?q=${encodeURIComponent(product.name)}`}
                      className="mt-1 inline-block text-xs text-violet-700 hover:underline"
                    >
                      See content
                    </Link>
                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs text-ink-400 hover:text-ink-900"
                      >
                        Product page ↗
                      </a>
                    )}
                  </div>
                </div>

                {writable && (
                  <details className="border-t border-ink-100">
                    <summary className="cursor-pointer px-5 py-2.5 text-xs text-ink-400 hover:text-ink-900">
                      Edit
                    </summary>
                    <div className="space-y-4 px-5 pb-5">
                      <ProductForm product={product} />
                      <form action={deleteProduct} className="border-t border-ink-100 pt-4">
                        <input type="hidden" name="id" value={product.id} />
                        <ConfirmSubmit
                          message={`Delete ${product.name}? Content records keep their history but lose the product link.`}
                        >
                          Delete product
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </details>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
