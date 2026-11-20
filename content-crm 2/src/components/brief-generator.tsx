"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { type BriefDraft, generateBrief } from "@/app/actions/ai";
import { Button, Note, Textarea, cx } from "@/components/ui";

export type BriefContext = {
  title: string;
  productId: string | null;
  creatorId: string | null;
  formats: string[];
  platforms: string[];
  goal: string | null;
};

/**
 * Asks the model for hook options, a brief, a shot list and a caption, then
 * hands them to the form. Nothing is applied without a click, so a draft never
 * silently overwrites something you wrote.
 */
export function BriefGenerator({
  context,
  onUseHook,
  onUseBrief,
  onUseShotList,
  onUseCaption,
}: {
  context: BriefContext;
  onUseHook: (hook: string) => void;
  onUseBrief: (brief: string) => void;
  onUseShotList: (shotList: string) => void;
  onUseCaption: (caption: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("");
  const [draft, setDraft] = useState<BriefDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);

    startTransition(async () => {
      const result = await generateBrief({ ...context, notes: direction || null });

      if (!result.ok) {
        setError(result.error);
        setDraft(null);
        return;
      }

      setDraft(result.draft);
      toast.success("Draft ready. Pick what you want to keep.");
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Sparkles size={13} strokeWidth={2} aria-hidden />
        Draft with AI
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
            <Sparkles size={14} strokeWidth={2} aria-hidden />
            Draft with AI
          </h3>
          <p className="mt-0.5 text-xs text-ink-400">
            Uses the title, product, creator and formats on this page. Nothing is applied until
            you click.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-400 hover:text-ink-900"
        >
          Close
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <Textarea
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
          rows={2}
          placeholder="Optional direction: angle, audience, things to avoid…"
          className="min-h-0 bg-surface"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={run} disabled={pending || !context.title.trim()}>
            {pending ? "Drafting…" : draft ? "Draft again" : "Draft"}
          </Button>
          {!context.title.trim() && (
            <span className="text-xs text-ink-400">Add a title first.</span>
          )}
        </div>
      </div>

      {error && <Note className="mt-3">{error}</Note>}

      {draft && (
        <div className="mt-4 space-y-4">
          {draft.hooks.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-medium text-ink-600">
                Hook options — click one to use it
              </h4>
              <ul className="space-y-1.5">
                {draft.hooks.map((hook) => (
                  <li key={hook}>
                    <button
                      type="button"
                      onClick={() => {
                        onUseHook(hook);
                        toast.success("Hook applied");
                      }}
                      className={cx(
                        "w-full rounded-lg border border-ink-100 bg-surface px-3 py-2 text-left text-sm text-ink-800 transition-colors",
                        "hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-400/10",
                      )}
                    >
                      {hook}
                      <span className="ml-2 text-xs text-ink-400">{hook.length} chars</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {draft.brief && (
            <DraftBlock
              label="Brief"
              body={draft.brief}
              onUse={() => {
                onUseBrief(draft.brief);
                toast.success("Brief applied");
              }}
            />
          )}

          {draft.shotList.length > 0 && (
            <DraftBlock
              label="Shot list"
              body={draft.shotList.map((shot, index) => `${index + 1}. ${shot}`).join("\n")}
              onUse={() => {
                onUseShotList(draft.shotList.map((shot) => `- ${shot}`).join("\n"));
                toast.success("Shot list applied");
              }}
            />
          )}

          {draft.caption && (
            <DraftBlock
              label={`Caption (${draft.caption.length} chars)`}
              body={draft.caption}
              onUse={() => {
                onUseCaption(draft.caption);
                toast.success("Caption applied");
              }}
            />
          )}

          <p className="text-xs text-ink-400">
            Read it before you send it. The model does not know your real results, so check any
            claim against what the brand can actually say.
          </p>
        </div>
      )}
    </div>
  );
}

function DraftBlock({
  label,
  body,
  onUse,
}: {
  label: string;
  body: string;
  onUse: () => void;
}) {
  return (
    <section className="rounded-lg border border-ink-100 bg-surface p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h4 className="text-xs font-medium text-ink-600">{label}</h4>
        <Button type="button" size="sm" variant="ghost" onClick={onUse}>
          Use this
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink-800">{body}</p>
    </section>
  );
}
