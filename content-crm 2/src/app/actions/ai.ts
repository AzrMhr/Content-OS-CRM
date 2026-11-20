"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireWriter } from "@/lib/auth";
import { errorMessage } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

/**
 * Drafts hooks, a brief and a shot list for a UGC video.
 *
 * This runs only on the server. The API key is read from ANTHROPIC_API_KEY and
 * never reaches the browser — do not move it to a NEXT_PUBLIC_ variable, which
 * would publish it to anyone who opens the page.
 */

const DEFAULT_MODEL = "claude-sonnet-5-5";

export type BriefDraft = {
  hooks: string[];
  brief: string;
  shotList: string[];
  caption: string;
};

export type BriefResult =
  | { ok: true; draft: BriefDraft }
  | { ok: false; error: string; configured: boolean };

type BriefInput = {
  title: string;
  productId: string | null;
  creatorId: string | null;
  formats: string[];
  platforms: string[];
  goal: string | null;
  notes: string | null;
};

const TOOL_NAME = "deliver_brief";

export async function generateBrief(input: BriefInput): Promise<BriefResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      configured: false,
      error:
        "No ANTHROPIC_API_KEY is set. Add it in .env.local for local work and in your Vercel project settings for the deployed app, then try again.",
    };
  }

  try {
    await requireWriter();

    if (!input.title?.trim()) {
      return { ok: false, configured: true, error: "Give the piece a title first." };
    }

    // Pull the product and creator context from the database rather than
    // trusting whatever the browser sent.
    const supabase = await createClient();

    const [product, creator] = await Promise.all([
      input.productId
        ? supabase
            .from("products")
            .select("name, category, price, benefits, pain_points, offer")
            .eq("id", input.productId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      input.creatorId
        ? supabase
            .from("creators")
            .select("name, niches, platforms, notes")
            .eq("id", input.creatorId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 2000,
      system: [
        "You write briefs for user-generated-content videos for an ecommerce brand.",
        "Write the way a real customer talks: plain, specific, no marketing throat-clearing.",
        "Never invent a statistic, a review, an endorsement or a result the brand has not given you.",
        "Never write a health, medical or efficacy claim — no curing, treating, or guaranteed outcomes.",
        "If the product context is thin, keep the copy general rather than filling the gap with invented detail.",
      ].join(" "),
      tools: [
        {
          name: TOOL_NAME,
          description: "Return the drafted hooks, brief, shot list and caption.",
          input_schema: {
            type: "object",
            properties: {
              hooks: {
                type: "array",
                items: { type: "string" },
                description:
                  "Five distinct opening lines for the first three seconds, each under 60 characters so it fits as on-screen text. Vary the angle: problem, curiosity, result, contrarian, personal.",
              },
              brief: {
                type: "string",
                description:
                  "A short brief for the creator: what to show, the must-say points, the tone, and what to avoid. Plain prose, under 150 words, no headings.",
              },
              shotList: {
                type: "array",
                items: { type: "string" },
                description:
                  "Four to seven shots in filming order, each a short phrase.",
              },
              caption: {
                type: "string",
                description:
                  "One caption under 125 characters so it survives the Instagram fold. No hashtag spam; at most two.",
              },
            },
            required: ["hooks", "brief", "shotList", "caption"],
          },
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [
        {
          role: "user",
          content: buildPrompt(input, product.data, creator.data),
        },
      ],
    });

    const block = response.content.find((part) => part.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return { ok: false, configured: true, error: "The model returned nothing usable. Try again." };
    }

    const draft = parseDraft(block.input);
    if (!draft) {
      return {
        ok: false,
        configured: true,
        error: "The model's reply was not in the expected shape. Try again.",
      };
    }

    return { ok: true, draft };
  } catch (error) {
    // Surface the provider's own message (bad key, no credit, rate limit) so
    // the person can act on it instead of guessing.
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return { ok: false, configured: true, error: "That ANTHROPIC_API_KEY was rejected." };
      }
      if (error.status === 429) {
        return {
          ok: false,
          configured: true,
          error: "Rate limited by the API. Wait a moment and try again.",
        };
      }
      return { ok: false, configured: true, error: `API error: ${error.message}` };
    }

    return { ok: false, configured: true, error: errorMessage(error) };
  }
}

function buildPrompt(
  input: BriefInput,
  product: {
    name?: string | null;
    category?: string | null;
    price?: number | null;
    benefits?: string | null;
    pain_points?: string | null;
    offer?: string | null;
  } | null,
  creator: {
    name?: string | null;
    niches?: string[] | null;
    platforms?: string[] | null;
    notes?: string | null;
  } | null,
): string {
  const lines: string[] = [`Working title: ${input.title}`];

  if (product?.name) {
    lines.push(`Product: ${product.name}${product.category ? ` (${product.category})` : ""}`);
    if (product.price) lines.push(`Price: $${product.price}`);
    if (product.benefits) lines.push(`Benefits the brand claims: ${product.benefits}`);
    if (product.pain_points) lines.push(`Customer pain points: ${product.pain_points}`);
    if (product.offer) lines.push(`Current offer: ${product.offer}`);
  } else {
    lines.push("Product: not linked yet, so keep the copy about the category in general.");
  }

  if (creator?.name) {
    lines.push(`Creator: ${creator.name}`);
    if (creator.niches?.length) lines.push(`Their niches: ${creator.niches.join(", ")}`);
    if (creator.notes) lines.push(`Notes on this creator: ${creator.notes}`);
  }

  if (input.formats.length) lines.push(`Formats: ${input.formats.join(", ")}`);
  if (input.platforms.length) lines.push(`Posting to: ${input.platforms.join(", ")}`);
  if (input.goal) lines.push(`Goal: ${input.goal.replace(/_/g, " ")}`);
  if (input.notes?.trim()) lines.push(`Extra direction from the team: ${input.notes.trim()}`);

  lines.push("", `Draft the hooks, brief, shot list and caption. Call ${TOOL_NAME}.`);

  return lines.join("\n");
}

/** The tool input arrives as `unknown`, so check its shape before using it. */
function parseDraft(value: unknown): BriefDraft | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;

  const strings = (input: unknown): string[] =>
    Array.isArray(input)
      ? input.filter((item): item is string => typeof item === "string" && item.trim() !== "")
      : [];

  const hooks = strings(raw.hooks);
  const shotList = strings(raw.shotList);
  const brief = typeof raw.brief === "string" ? raw.brief : "";
  const caption = typeof raw.caption === "string" ? raw.caption : "";

  if (hooks.length === 0 && !brief) return null;

  return { hooks, brief, shotList, caption };
}
