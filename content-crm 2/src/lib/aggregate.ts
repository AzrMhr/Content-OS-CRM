import type { Content } from "./types";
import { parseDate } from "./format";

export type WeekPoint = {
  /** ISO date of the Monday that starts the week. */
  week: string;
  label: string;
  views: number;
  spend: number;
  revenue: number;
  posts: number;
};

export type FormatPoint = {
  format: string;
  avgViews: number;
  posts: number;
};

/** Monday of the week containing `date`, in UTC. */
function weekStart(date: Date): Date {
  const copy = new Date(date.getTime());
  const weekday = copy.getUTCDay(); // 0 = Sunday
  const offset = weekday === 0 ? -6 : 1 - weekday;
  copy.setUTCDate(copy.getUTCDate() + offset);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/**
 * Buckets posted content into the last `weeks` calendar weeks.
 * Empty weeks are kept so the time axis stays even.
 */
export function weeklySeries(content: Content[], weeks = 12): WeekPoint[] {
  const thisWeek = weekStart(new Date());

  const buckets = new Map<string, WeekPoint>();

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const start = new Date(thisWeek.getTime());
    start.setUTCDate(start.getUTCDate() - index * 7);
    const key = start.toISOString().slice(0, 10);

    buckets.set(key, {
      week: key,
      label: start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      views: 0,
      spend: 0,
      revenue: 0,
      posts: 0,
    });
  }

  for (const item of content) {
    const posted = parseDate(item.post_date);
    if (!posted) continue;

    const key = weekStart(posted).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the window

    bucket.views += item.views ?? 0;
    bucket.spend += item.ad_spend ?? 0;
    bucket.revenue += item.revenue ?? 0;
    bucket.posts += 1;
  }

  return [...buckets.values()];
}

/**
 * Average views per format, across posted content that has a view count.
 * A piece tagged with two formats counts toward both.
 */
export function formatPerformance(content: Content[], limit = 6): FormatPoint[] {
  const totals = new Map<string, { views: number; posts: number }>();

  for (const item of content) {
    if (item.status !== "posted" || item.views === null) continue;

    for (const format of item.formats ?? []) {
      const current = totals.get(format) ?? { views: 0, posts: 0 };
      current.views += item.views;
      current.posts += 1;
      totals.set(format, current);
    }
  }

  return [...totals.entries()]
    .map(([format, { views, posts }]) => ({
      format,
      avgViews: Math.round(views / posts),
      posts,
    }))
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, limit);
}
