"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moveContent } from "@/app/actions/content";
import { Note, TagList, cx } from "@/components/ui";
import { BOARD_STATUSES } from "@/lib/constants";
import { daysUntil, relativeDays } from "@/lib/format";
import type { ContentStatus } from "@/lib/types";

export type BoardCard = {
  id: string;
  title: string;
  status: ContentStatus;
  creatorName: string | null;
  productName: string | null;
  dueDate: string | null;
  formats: string[];
  usage: string;
};

type Move = { id: string; status: ContentStatus };

export function Board({ cards, canWrite }: { cards: BoardCard[]; canWrite: boolean }) {
  const [items, applyMove] = useOptimistic(cards, (state: BoardCard[], move: Move) =>
    state.map((card) => (card.id === move.id ? { ...card, status: move.status } : card)),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ContentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(id: string, status: ContentStatus) {
    const card = items.find((c) => c.id === id);
    if (!card || card.status === status) return;

    setError(null);
    startTransition(async () => {
      applyMove({ id, status });
      const result = await moveContent(id, status);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDrop(status: ContentStatus) {
    const id = dragId;
    setDragId(null);
    setOverColumn(null);
    if (!id || !canWrite) return;
    move(id, status);
  }

  return (
    <>
      {error && <Note className="mb-3">{error}</Note>}

      <div className="-mx-4 overflow-x-auto px-4 pb-3 scrollbar-slim md:-mx-8 md:px-8">
        <div className="flex min-w-max gap-3">
          {BOARD_STATUSES.map((status) => {
            const columnCards = items.filter((card) => card.status === status.value);
            const isOver = overColumn === status.value;

            return (
              <section
                key={status.value}
                onDragOver={(event) => {
                  if (!canWrite || !dragId) return;
                  event.preventDefault();
                  setOverColumn(status.value);
                }}
                onDragLeave={() => setOverColumn((cur) => (cur === status.value ? null : cur))}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(status.value);
                }}
                className={cx(
                  "flex w-64 shrink-0 flex-col rounded-xl border bg-surface/60 transition-colors",
                  isOver
                    ? "border-violet-400 bg-violet-50/60 dark:bg-violet-400/10"
                    : "border-ink-100",
                )}
              >
                <header className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-2.5">
                  <h2 className="text-xs font-semibold text-ink-800">{status.label}</h2>
                  <span className="rounded bg-ink-100 px-1.5 text-[11px] tabular-nums text-ink-600">
                    {columnCards.length}
                  </span>
                </header>

                <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                  {columnCards.map((card) => {
                    const overdue = (daysUntil(card.dueDate) ?? 1) < 0;

                    return (
                      <article
                        key={card.id}
                        draggable={canWrite}
                        onDragStart={() => setDragId(card.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverColumn(null);
                        }}
                        className={cx(
                          "rounded-lg border border-ink-100 bg-surface p-2.5 shadow-[0_1px_2px_rgb(18_19_23_/_0.04)]",
                          canWrite && "cursor-grab active:cursor-grabbing",
                          dragId === card.id && "opacity-40",
                        )}
                      >
                        <Link
                          href={`/content/${card.id}`}
                          className="block text-sm font-medium leading-snug text-ink-900 hover:text-violet-700"
                        >
                          {card.title}
                        </Link>

                        <div className="mt-2 space-y-1.5">
                          {card.formats.length > 0 && <TagList items={card.formats} max={2} />}

                          <p className="truncate text-xs text-ink-400">
                            {card.creatorName ?? "No creator"}
                            {card.productName ? ` · ${card.productName}` : ""}
                          </p>

                          {card.dueDate && (
                            <p
                              className={cx(
                                "text-xs",
                                overdue ? "font-medium text-rose-700" : "text-ink-400",
                              )}
                            >
                              Due {relativeDays(card.dueDate)}
                            </p>
                          )}

                          {card.usage !== "organic" && (
                            <p className="text-xs text-sky-700">
                              {card.usage === "paid" ? "Paid ad" : "Organic + paid"}
                            </p>
                          )}
                        </div>

                        {canWrite && (
                          <label className="mt-2 block">
                            <span className="sr-only">Move {card.title} to another stage</span>
                            <select
                              value={card.status}
                              onChange={(event) =>
                                move(card.id, event.target.value as ContentStatus)
                              }
                              className="w-full rounded border border-ink-100 bg-ink-50 px-1.5 py-1 text-[11px] text-ink-600 hover:border-ink-200"
                            >
                              {BOARD_STATUSES.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </article>
                    );
                  })}

                  {columnCards.length === 0 && (
                    <p className="px-1 py-3 text-xs text-ink-200">Nothing here</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
