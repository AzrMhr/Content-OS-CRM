"use client";

import { Command } from "cmdk";
import {
  CircleUser,
  Film,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SearchGroup } from "@/app/api/search/route";
import { cx } from "@/components/ui";

export const OPEN_PALETTE_EVENT = "content-crm:open-palette";

type Jump = { label: string; href: string; icon: typeof Search; adminOnly?: boolean };

const JUMPS: Jump[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pipeline board", href: "/pipeline", icon: KanbanSquare },
  { label: "All content", href: "/content", icon: Film },
  { label: "Creators", href: "/creators", icon: CircleUser },
  { label: "Products", href: "/products", icon: Package },
  { label: "Team", href: "/team", icon: Users, adminOnly: true },
];

export function CommandPalette({
  isAdmin,
  canWrite,
}: {
  isAdmin: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // Cmd+K / Ctrl+K, plus the sidebar button's custom event.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    function onOpenRequest() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpenRequest);
    };
  }, []);

  // Debounced search. The server does the filtering, so cmdk's own is off.
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("search failed");
          const payload = (await response.json()) as { groups: SearchGroup[] };
          setGroups(payload.groups ?? []);
        } catch {
          // An aborted or failed search leaves the jump list, which is still useful.
        } finally {
          setLoading(false);
        }
      },
      query ? 180 : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const jumps = JUMPS.filter((jump) => !jump.adminOnly || isAdmin);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      label="Search and jump to a record"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-ink-900/40 backdrop-blur-[1px]"
      />

      <div className="absolute left-1/2 top-[12vh] w-[min(92vw,34rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-ink-100 px-4">
          <Search size={15} className="shrink-0 text-ink-400" aria-hidden />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search content, creators and products…"
            className="h-12 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
          <kbd className="shrink-0 rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-400">
            esc
          </kbd>
        </div>

        <Command.List className="max-h-[22rem] overflow-y-auto overscroll-contain p-2 scrollbar-slim">
          {!loading && groups.length === 0 && query !== "" && (
            <Command.Empty className="px-3 py-8 text-center text-sm text-ink-400">
              Nothing matches “{query}”.
            </Command.Empty>
          )}

          {canWrite && (
            <Command.Group heading="Create" className={GROUP_CLASS}>
              <PaletteItem
                icon={Plus}
                title="New content"
                subtitle="Add a video or post"
                onSelect={() => go("/content/new")}
              />
              <PaletteItem
                icon={Plus}
                title="Add creator"
                subtitle="Put someone on the roster"
                onSelect={() => go("/creators/new")}
              />
            </Command.Group>
          )}

          {groups.map((group) => (
            <Command.Group key={group.label} heading={group.label} className={GROUP_CLASS}>
              {group.items.map((item) => (
                <PaletteItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  onSelect={() => go(item.href)}
                />
              ))}
            </Command.Group>
          ))}

          <Command.Group heading="Go to" className={GROUP_CLASS}>
            {jumps.map((jump) => (
              <PaletteItem
                key={jump.href}
                icon={jump.icon}
                title={jump.label}
                onSelect={() => go(jump.href)}
              />
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-400";

function PaletteItem({
  title,
  subtitle,
  icon: Icon,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof Search;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${title} ${subtitle ?? ""}`}
      onSelect={onSelect}
      className={cx(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink-800",
        "data-[selected=true]:bg-ink-50 data-[selected=true]:text-ink-900",
      )}
    >
      {Icon && <Icon size={14} strokeWidth={1.75} className="shrink-0 text-ink-400" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {subtitle && <span className="shrink-0 text-xs text-ink-400">{subtitle}</span>}
    </Command.Item>
  );
}

/** The visible way in, for people who do not know the shortcut. */
export function CommandTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      className="flex w-full items-center gap-2 rounded-lg border border-nav-line bg-nav-hover px-2.5 py-1.5 text-xs text-nav-muted transition-colors hover:text-nav-text"
    >
      <Search size={13} strokeWidth={1.75} aria-hidden />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="rounded border border-nav-line px-1 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
