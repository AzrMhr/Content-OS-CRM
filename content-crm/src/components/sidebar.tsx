"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";
import type { Profile, UserRole } from "@/lib/types";

const NAV: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/content", label: "Content" },
  { href: "/creators", label: "Creators" },
  { href: "/products", label: "Products" },
  { href: "/team", label: "Team", adminOnly: true },
];

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => !item.adminOnly || profile.role === "admin");

  return (
    <aside className="flex shrink-0 flex-col border-b border-ink-800 bg-ink-950 md:h-dvh md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-semibold text-ink-950">
          C
        </span>
        <span className="text-sm font-semibold text-white">Content CRM</span>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 scrollbar-slim md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-ink-800 font-medium text-white"
                  : "text-ink-400 hover:bg-ink-900 hover:text-ink-100",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-ink-800 px-4 py-3 md:block">
        <p className="truncate text-sm text-ink-100">{profile.full_name ?? profile.email}</p>
        <p className="mt-0.5 text-xs text-ink-400">{ROLE_LABEL[profile.role]}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-2.5 text-xs text-ink-400 underline decoration-ink-600 underline-offset-2 hover:text-ink-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
