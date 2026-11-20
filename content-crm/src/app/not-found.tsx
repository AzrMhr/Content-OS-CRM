import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-ink-400">404</p>
      <h1 className="text-xl font-semibold text-ink-900">That record does not exist</h1>
      <p className="max-w-sm text-sm text-ink-400">
        It may have been deleted, or the link is wrong.
      </p>
      <Link href="/dashboard" className={buttonClass("secondary")}>
        Back to dashboard
      </Link>
    </main>
  );
}
