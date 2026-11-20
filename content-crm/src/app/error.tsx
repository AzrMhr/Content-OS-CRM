"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-ink-900">Something broke</h1>
      <p className="max-w-md text-sm text-ink-600">
        {error.message || "An unexpected error stopped this page from loading."}
      </p>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </main>
  );
}
