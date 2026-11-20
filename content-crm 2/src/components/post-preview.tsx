"use client";

import { Bookmark, Heart, MessageCircle, Music2, Play, Send } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { cx } from "@/components/ui";

/**
 * Per-platform caption limits.
 *
 * `hardLimit` is the maximum the platform accepts. `visible` is roughly how
 * much shows before the caption is cut off with a "more" link, which is the
 * number that actually decides whether your hook lands.
 *
 * Platforms change these without notice. Instagram's 125-character fold is
 * long-standing; the others are close approximations. Check them against the
 * app you post from and edit this table — nothing else needs to change.
 */
const SURFACES = [
  {
    id: "tiktok",
    label: "TikTok",
    shape: "vertical",
    hardLimit: 2200,
    visible: 70,
  },
  {
    id: "reels",
    label: "Reels",
    shape: "vertical",
    hardLimit: 2200,
    visible: 55,
  },
  {
    id: "feed",
    label: "IG feed",
    shape: "square",
    hardLimit: 2200,
    visible: 125,
  },
] as const;

type SurfaceId = (typeof SURFACES)[number]["id"];

export function PostPreview({
  hook,
  caption,
  creatorHandle,
  productName,
}: {
  hook: string | null;
  caption: string | null;
  creatorHandle?: string | null;
  productName?: string | null;
}) {
  const [active, setActive] = useState<SurfaceId>("tiktok");
  const surface = SURFACES.find((s) => s.id === active) ?? SURFACES[0];

  const captionText = caption?.trim() ?? "";
  const hookText = hook?.trim() ?? "";
  const handle = creatorHandle?.replace(/^@/, "") ?? "yourbrand";

  const overLimit = captionText.length > surface.hardLimit;
  const folds = captionText.length > surface.visible;
  const shown = folds ? captionText.slice(0, surface.visible).trimEnd() : captionText;

  return (
    <div>
      <div className="flex gap-1 rounded-lg bg-ink-50 p-1">
        {SURFACES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={cx(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              active === item.id
                ? "bg-surface text-ink-900 shadow-sm"
                : "text-ink-600 hover:text-ink-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <div className="w-[248px]">
          {/* The frame ------------------------------------------------------ */}
          <div
            className={cx(
              "relative overflow-hidden rounded-[1.5rem] border-[6px] border-device bg-device",
              surface.shape === "vertical" ? "aspect-[9/16]" : "aspect-square",
            )}
          >
            {/* Stand-in for the video or image. No media is stored yet, so
                this shows where it goes rather than pretending to have one. */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-device-screen-from to-device-screen-to">
              <Play size={28} className="text-white/40" aria-hidden />
            </div>

            {/* The hook, as on-screen text. This is the part worth checking:
                if it does not fit here, it will not land in the first second. */}
            {hookText && (
              <p className="absolute inset-x-4 top-1/4 text-center text-[15px] font-bold leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.6)]">
                {hookText}
              </p>
            )}

            {surface.shape === "vertical" ? (
              <>
                <div className="absolute inset-x-3 bottom-3 pr-9">
                  <p className="text-xs font-semibold text-white">@{handle}</p>
                  {shown && (
                    <p className="mt-1 text-[11px] leading-snug text-white/90">
                      {shown}
                      {folds && <span className="font-medium text-white/60"> … more</span>}
                    </p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-white/70">
                    <Music2 size={10} aria-hidden />
                    original sound
                  </p>
                </div>
                <div className="absolute bottom-3 right-2 flex flex-col items-center gap-3 text-white">
                  <Heart size={18} aria-hidden />
                  <MessageCircle size={18} aria-hidden />
                  <Send size={18} aria-hidden />
                </div>
              </>
            ) : (
              <p className="absolute bottom-2 left-3 text-xs font-semibold text-white">
                @{handle}
              </p>
            )}
          </div>

          {/* Feed caption sits under the image rather than over it --------- */}
          {surface.shape === "square" && (
            <div className="mt-2.5 px-0.5">
              <div className="flex items-center justify-between text-ink-900">
                <div className="flex gap-3">
                  <Heart size={18} aria-hidden />
                  <MessageCircle size={18} aria-hidden />
                  <Send size={18} aria-hidden />
                </div>
                <Bookmark size={18} aria-hidden />
              </div>
              <p className="mt-2 text-xs leading-snug text-ink-800">
                <span className="font-semibold">@{handle}</span>{" "}
                {shown || <span className="text-ink-400">No caption yet</span>}
                {folds && <span className="text-ink-400"> … more</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Counts and warnings -------------------------------------------- */}
      <dl className="mt-4 space-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-400">Hook length</dt>
          <dd className="tabular-nums text-ink-800">
            {hookText.length === 0 ? "—" : `${hookText.length} characters`}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-400">Caption length</dt>
          <dd
            className={cx(
              "tabular-nums",
              overLimit ? "font-medium text-rose-700 dark:text-rose-300" : "text-ink-800",
            )}
          >
            {captionText.length} / {surface.hardLimit}
          </dd>
        </div>
      </dl>

      {overLimit && (
        <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
          Over the {surface.label} limit by {captionText.length - surface.hardLimit} characters.
        </p>
      )}

      {!overLimit && folds && (
        <p className="mt-2 text-xs text-ink-400">
          Cut off after about {surface.visible} characters on {surface.label}. Put the point
          before the fold.
        </p>
      )}

      {hookText.length > 60 && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          That hook is long for on-screen text. Under about 60 characters stays readable at a
          glance.
        </p>
      )}

      {(hookText || captionText) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hookText && <CopyButton value={hookText} label="Hook" />}
          {captionText && <CopyButton value={captionText} label="Caption" />}
          {productName && (
            <span className="inline-flex items-center rounded-md border border-ink-100 bg-ink-50 px-1.5 py-1 text-[11px] text-ink-400">
              {productName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
