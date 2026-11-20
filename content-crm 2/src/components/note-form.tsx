"use client";

import { useActionState, useEffect, useRef } from "react";
import { addContentNote } from "@/app/actions/content";
import { Button, Note, Textarea } from "@/components/ui";
import type { ActionResult } from "@/lib/types";
import { useSuccessToast } from "@/lib/use-success-toast";

export function NoteForm({ contentId }: { contentId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addContentNote,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useSuccessToast(state, "Note added");

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
      {state && !state.ok && <Note>{state.error}</Note>}
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add note"}
      </Button>
    </form>
  );
}
