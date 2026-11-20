"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/** Submit button that asks once before firing a destructive server action. */
export function ConfirmSubmit({
  children,
  message,
  variant = "danger",
  size = "sm",
}: {
  children: React.ReactNode;
  message: string;
  variant?: "danger" | "secondary";
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </Button>
  );
}

/** Plain submit button that shows pending state inside a server-action form. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}
