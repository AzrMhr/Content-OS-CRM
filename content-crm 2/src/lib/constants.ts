import type {
  ContentGoal,
  ContentStatus,
  ContentUsage,
  CreatorStatus,
  DealType,
  ProductPriority,
  UsageRights,
  UserRole,
} from "./types";

/** Tailwind classes per status chip. Keep tone, not brightness, as the signal. */
type Tone = "slate" | "violet" | "amber" | "blue" | "rose" | "emerald" | "zinc";

export const TONE_CLASS: Record<Tone, string> = {
  slate:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/25",
  violet:
    "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-400/15 dark:text-violet-300 dark:ring-violet-400/25",
  amber:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25",
  blue: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/25",
  rose: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/25",
  emerald:
    "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/25",
  zinc: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-400/15 dark:text-zinc-300 dark:ring-zinc-400/25",
};

export const CONTENT_STATUSES: {
  value: ContentStatus;
  label: string;
  tone: Tone;
  /** Hidden from the board by default so finished work does not crowd it. */
  offBoard?: boolean;
}[] = [
  { value: "idea", label: "Idea", tone: "slate" },
  { value: "brief_sent", label: "Brief sent", tone: "violet" },
  { value: "product_shipped", label: "Product shipped", tone: "amber" },
  { value: "scripting", label: "Scripting", tone: "blue" },
  { value: "filming", label: "Filming", tone: "rose" },
  { value: "editing", label: "Editing", tone: "rose" },
  { value: "awaiting_approval", label: "Awaiting approval", tone: "amber" },
  { value: "scheduled", label: "Scheduled", tone: "blue" },
  { value: "posted", label: "Posted", tone: "emerald" },
  { value: "archived", label: "Archived", tone: "zinc", offBoard: true },
];

/** Statuses that mean the work is still moving. Used for pipeline counts. */
export const ACTIVE_CONTENT_STATUSES: ContentStatus[] = CONTENT_STATUSES.filter(
  (s) => s.value !== "posted" && s.value !== "archived",
).map((s) => s.value);

export const BOARD_STATUSES = CONTENT_STATUSES.filter((s) => !s.offBoard);

export const CREATOR_STATUSES: { value: CreatorStatus; label: string; tone: Tone }[] = [
  { value: "prospect", label: "Prospect", tone: "slate" },
  { value: "outreach_sent", label: "Outreach sent", tone: "blue" },
  { value: "negotiating", label: "Negotiating", tone: "amber" },
  { value: "active", label: "Active", tone: "emerald" },
  { value: "paused", label: "Paused", tone: "zinc" },
  { value: "not_a_fit", label: "Not a fit", tone: "rose" },
];

export const CONTENT_GOALS: { value: ContentGoal; label: string }[] = [
  { value: "awareness", label: "Awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "traffic", label: "Traffic" },
  { value: "sales", label: "Sales" },
  { value: "social_proof", label: "Social proof" },
  { value: "retention", label: "Retention" },
];

export const CONTENT_USAGES: { value: ContentUsage; label: string }[] = [
  { value: "organic", label: "Organic" },
  { value: "paid", label: "Paid ad" },
  { value: "both", label: "Both" },
];

export const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: "gifted", label: "Gifted" },
  { value: "paid_per_video", label: "Paid per video" },
  { value: "affiliate", label: "Affiliate" },
  { value: "retainer", label: "Retainer" },
];

export const USAGE_RIGHTS: { value: UsageRights; label: string }[] = [
  { value: "organic_only", label: "Organic only" },
  { value: "paid_30", label: "Paid ads, 30 days" },
  { value: "paid_90", label: "Paid ads, 90 days" },
  { value: "perpetual", label: "Perpetual" },
];

export const PRODUCT_PRIORITIES: { value: ProductPriority; label: string; tone: Tone }[] = [
  { value: "hero", label: "Hero", tone: "rose" },
  { value: "core", label: "Core", tone: "blue" },
  { value: "new_launch", label: "New launch", tone: "emerald" },
  { value: "seasonal", label: "Seasonal", tone: "amber" },
];

export const USER_ROLES: { value: UserRole; label: string; blurb: string }[] = [
  { value: "admin", label: "Admin", blurb: "Full access, and can change roles" },
  { value: "editor", label: "Editor", blurb: "Can add and edit everything" },
  { value: "viewer", label: "Viewer", blurb: "Read only" },
];

/** Free-text tag vocabularies. Add your own, nothing in the database enforces these. */
export const CONTENT_FORMATS = [
  "Testimonial",
  "Unboxing",
  "Product Demo",
  "Problem / Solution",
  "Before & After",
  "Review",
  "Routine / GRWM",
  "Lifestyle",
  "Founder Story",
  "Brand Film",
  "Trend",
  "Carousel",
  "Static",
  "Story",
  "Promo / Sale",
  "Campaign",
];

export const PLATFORMS = [
  "TikTok",
  "Instagram",
  "Instagram Reels",
  "YouTube",
  "YouTube Shorts",
  "Facebook",
  "Pinterest",
  "Meta Ads",
  "TikTok Ads",
  "Product Page",
  "Email",
];

export const NICHES = [
  "Beauty",
  "Fashion",
  "Fitness",
  "Home",
  "Food",
  "Tech",
  "Parenting",
  "Lifestyle",
];

export const CREATOR_PLATFORMS = ["TikTok", "Instagram", "YouTube"];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function contentStatus(value: ContentStatus) {
  return CONTENT_STATUSES.find((s) => s.value === value) ?? CONTENT_STATUSES[0];
}

export function creatorStatus(value: CreatorStatus) {
  return CREATOR_STATUSES.find((s) => s.value === value) ?? CREATOR_STATUSES[0];
}

export function productPriority(value: ProductPriority) {
  return PRODUCT_PRIORITIES.find((p) => p.value === value) ?? PRODUCT_PRIORITIES[1];
}

export function labelOf<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T | null | undefined,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
