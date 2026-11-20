import { hasSupabaseEnv } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Content CRM" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const { next, message } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-sm font-semibold text-ink-50">
            C
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Content CRM</h1>
          <p className="mt-1 text-sm text-ink-400">
            Creator roster and content pipeline for the brand.
          </p>
        </div>

        {!hasSupabaseEnv() ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
            <p className="font-medium">Supabase is not configured yet</p>
            <p className="mt-1 text-amber-800 dark:text-amber-300/90">
              Copy <code className="font-mono text-xs">.env.example</code> to{" "}
              <code className="font-mono text-xs">.env.local</code>, add your project URL and anon
              key, then restart the dev server. The README walks through it.
            </p>
          </div>
        ) : (
          <LoginForm next={next ?? "/dashboard"} message={message} />
        )}
      </div>
    </main>
  );
}
