import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { canWrite, isAdmin, requireProfile } from "@/lib/auth";

// Every page in here reads the signed-in session, so none of it can be
// prerendered at build time. This also keeps `next build` working on Vercel
// before the environment variables are filled in.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <CommandPalette isAdmin={isAdmin(profile)} canWrite={canWrite(profile)} />
      <Sidebar profile={profile} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {profile.role === "viewer" && (
          <p className="mb-5 rounded-lg border border-ink-100 bg-surface px-3.5 py-2 text-xs text-ink-600">
            You have read-only access. Ask an admin for editor rights to make changes.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
