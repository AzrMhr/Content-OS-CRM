"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cx } from "@/components/ui";

/** Copies text to the clipboard, for hooks and captions headed into an app. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label === "Copy" ? "Copied" : `${label} copied`} to clipboard`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Your browser blocked clipboard access. Select the text and copy it manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-md border border-ink-200 bg-surface px-1.5 py-1 text-[11px] font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900",
        className,
      )}
    >
      {copied ? (
        <Check size={12} strokeWidth={2.25} aria-hidden />
      ) : (
        <Copy size={12} strokeWidth={2} aria-hidden />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
