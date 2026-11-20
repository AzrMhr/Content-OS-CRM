"use client";

import {
  CircleUser,
  Film,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommandTrigger } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { cx } from "@/components/ui";
import type { Profile, UserRole } from "@/lib/types";

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/content", label: "Content", icon: Film },
  { href: "/creators", label: "Creators", icon: CircleUser },
  { href: "/products", label: "Products", icon: Package },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
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
    <aside className="flex shrink-0 flex-col border-b border-nav-line bg-nav md:h-dvh md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-nav-text text-xs font-semibold text-nav">
          C
        </span>
        <span className="text-sm font-semibold text-nav-text">Content CRM</span>
      </div>

      <div className="hidden px-3 pb-3 md:block">
        <CommandTrigger />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 scrollbar-slim md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-nav-active font-medium text-nav-text"
                  : "text-nav-muted hover:bg-nav-hover hover:text-nav-text",
              )}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-nav-line px-4 py-3 md:block">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-nav-text">
              {profile.full_name ?? profile.email}
            </p>
            <p className="mt-0.5 text-xs text-nav-muted">{ROLE_LABEL[profile.role]}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-xs text-nav-muted underline decoration-nav-line underline-offset-2 hover:text-nav-text"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
