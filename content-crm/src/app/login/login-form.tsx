"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Input, cx } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "signup" | "magic";

const TABS: { mode: Mode; label: string }[] = [
  { mode: "password", label: "Sign in" },
  { mode: "signup", label: "Create account" },
  { mode: "magic", label: "Email link" },
];

export function LoginForm({ next, message }: { next: string; message?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(message ?? null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    try {
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;

        // With email confirmation on, there is no session yet.
        if (!data.session) {
          setNotice("Check your email to confirm the account, then sign in.");
          setMode("password");
          return;
        }

        router.replace(next);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setNotice(`Sign-in link sent to ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-5 flex gap-1 rounded-lg bg-ink-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            onClick={() => {
              setMode(tab.mode);
              setError(null);
            }}
            className={cx(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              mode === tab.mode
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-600 hover:text-ink-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <Field label="Your name">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Carter"
              autoComplete="name"
            />
          </Field>
        )}

        <Field label="Work email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@brand.com"
            autoComplete="email"
          />
        </Field>

        {mode !== "magic" && (
          <Field
            label="Password"
            hint={mode === "signup" ? "At least 6 characters." : undefined}
          >
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Working…"
            : mode === "password"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send sign-in link"}
        </Button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-ink-400">
        The first account to sign up becomes the admin. Everyone after that starts as a viewer
        until an admin promotes them on the Team page.
      </p>
    </Card>
  );
}
