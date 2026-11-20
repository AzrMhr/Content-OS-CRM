"use client";

import { useActionState, useEffect, useRef } from "react";
import { addContentNote } from "@/app/actions/content";
import { Button, Textarea } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

export function NoteForm({ contentId }: { contentId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addContentNote,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2 px-5 py-4">
      <input type="hidden" name="content_id" value={contentId} />
      <Textarea
        name="note"
        rows={2}
        required
        placeholder="Creator asked for an extra day. New delivery Friday."
        className="min-h-0"
      />
      {state && !state.ok && <p className="text-sm text-rose-700">{state.error}</p>}
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add note"}
      </Button>
    </form>
  );
}
