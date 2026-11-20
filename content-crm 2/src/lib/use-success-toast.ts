"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionResult } from "./types";

/**
 * Fires one toast per successful submit. Errors are deliberately left to an
 * inline message, which stays on screen while the person fixes the field.
 */
export function useSuccessToast(state: ActionResult | null, message: string) {
  const lastSeen = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || state === lastSeen.current) return;
    lastSeen.current = state;
    if (state.ok) toast.success(message);
  }, [state, message]);
}
