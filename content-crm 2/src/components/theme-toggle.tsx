"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";

const ORDER = ["light", "dark", "system"] as const;

const ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const NEXT_LABEL = {
  light: "Switch to dark theme",
  dark: "Match the system theme",
  system: "Switch to light theme",
} as const;

/** Cycles light → dark → system. Lives in the sidebar footer. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server does not know the chosen theme, so render the frame only until
  // the client has read it. Otherwise the icon flashes the wrong state.
  useEffect(() => setMounted(true), []);

  const current = (ORDER as readonly string[]).includes(theme ?? "")
    ? (theme as (typeof ORDER)[number])
    : "system";
  const Icon = ICON[current];

  return (
    <button
      type="button"
      aria-label={mounted ? NEXT_LABEL[current] : "Change theme"}
      title={mounted ? NEXT_LABEL[current] : "Change theme"}
      onClick={() => setTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])}
      className={cx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-nav-muted transition-colors hover:bg-nav-hover hover:text-nav-text",
        className,
      )}
    >
      {mounted ? <Icon size={15} strokeWidth={1.75} aria-hidden /> : <span className="h-[15px]" />}
    </button>
  );
}
