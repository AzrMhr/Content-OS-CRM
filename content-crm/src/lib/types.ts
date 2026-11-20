export type UserRole = "admin" | "editor" | "viewer";

export type CreatorStatus =
  | "prospect"
  | "outreach_sent"
  | "negotiating"
  | "active"
  | "paused"
  | "not_a_fit";

export type DealType = "gifted" | "paid_per_video" | "affiliate" | "retainer";

export type UsageRights = "organic_only" | "paid_30" | "paid_90" | "perpetual";

export type ContentStatus =
  | "idea"
  | "brief_sent"
  | "product_shipped"
  | "scripting"
  | "filming"
  | "editing"
  | "awaiting_approval"
  | "scheduled"
  | "posted"
  | "archived";

export type ContentGoal =
  | "awareness"
  | "engagement"
  | "traffic"
  | "sales"
  | "social_proof"
  | "retention";

export type ContentUsage = "organic" | "paid" | "both";

export type ProductPriority = "hero" | "core" | "new_launch" | "seasonal";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  priority: ProductPriority;
  category: string | null;
  price: number | null;
  url: string | null;
  benefits: string | null;
  pain_points: string | null;
  offer: string | null;
  created_at: string;
  updated_at: string;
};

export type Creator = {
  id: string;
  name: string;
  status: CreatorStatus;
  niches: string[];
  platforms: string[];
  handle: string | null;
  profile_url: string | null;
  email: string | null;
  followers: number | null;
  deal: DealType | null;
  rate_per_video: number | null;
  rights: UsageRights | null;
  rating: number | null;
  notes: string | null;
  last_contacted: string | null;
  created_at: string;
  updated_at: string;
};

export type Content = {
  id: string;
  title: string;
  status: ContentStatus;
  formats: string[];
  platforms: string[];
  goal: ContentGoal | null;
  usage: ContentUsage;
  hook: string | null;
  brief: string | null;
  shot_list: string | null;
  caption: string | null;
  creator_id: string | null;
  product_id: string | null;
  owner_id: string | null;
  due_date: string | null;
  post_date: string | null;
  rights_expire_on: string | null;
  raw_footage_url: string | null;
  edited_url: string | null;
  live_url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  ad_spend: number | null;
  revenue: number | null;
  board_position: number;
  roas: number | null;
  engagement_rate: number | null;
  created_at: string;
  updated_at: string;
};

/** A content row with its related records joined in. */
export type ContentWithRelations = Content & {
  creator: Pick<Creator, "id" | "name" | "handle"> | null;
  product: Pick<Product, "id" | "name"> | null;
  owner: Pick<Profile, "id" | "full_name"> | null;
};

export type ContentActivity = {
  id: number;
  content_id: string;
  actor_id: string | null;
  kind: "created" | "status_change" | "note";
  from_status: ContentStatus | null;
  to_status: ContentStatus | null;
  note: string | null;
  created_at: string;
  actor: Pick<Profile, "id" | "full_name"> | null;
};

/** Shape returned by every server action, so forms can show one message. */
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
