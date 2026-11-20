import Link from "next/link";
import { TONE_CLASS } from "@/lib/constants";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Page scaffolding
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={cx(
        "rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgb(18_19_23_/_0.04)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  action,
  description,
}: {
  title: string;
  action?: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-400">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-ink-900 text-white hover:bg-ink-800",
  secondary: "border border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
} as const;

const BUTTON_SIZES = {
  sm: "h-8 px-2.5",
  md: "h-9 px-3.5",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;
type ButtonSize = keyof typeof BUTTON_SIZES;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size]);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cx(buttonClass(variant, size), className)}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export function Badge({
  children,
  tone = "zinc",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE_CLASS;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small neutral chips for array fields like formats and platforms. */
export function TagList({ items, max = 3 }: { items: string[]; max?: number }) {
  if (!items?.length) return <span className="text-ink-200">—</span>;
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;

  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((item) => (
        <span
          key={item}
          className="rounded border border-ink-100 bg-ink-50 px-1.5 py-0.5 text-[11px] text-ink-600"
        >
          {item}
        </span>
      ))}
      {rest > 0 && <span className="px-0.5 py-0.5 text-[11px] text-ink-400">+{rest}</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

const FIELD_CLASS =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 disabled:bg-ink-50";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-ink-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD_CLASS, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(FIELD_CLASS, "min-h-20 resize-y", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(FIELD_CLASS, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-slim">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cx(
        "whitespace-nowrap border-b border-ink-100 px-4 py-2.5 text-xs font-medium text-ink-400",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={cx(
        "border-b border-ink-100 px-4 py-2.5 align-middle text-ink-800",
        align === "right" ? "text-right tabular-nums" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function StatTile({
  label,
  value,
  footnote,
  tone,
}: {
  label: string;
  value: string;
  footnote?: string;
  tone?: "default" | "warn";
}) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p
        className={cx(
          "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight",
          tone === "warn" ? "text-amber-700" : "text-ink-900",
        )}
      >
        {value}
      </p>
      {footnote && <p className="mt-1 text-xs text-ink-400">{footnote}</p>}
    </Card>
  );
}

/** A labelled read-only value, for detail panels. */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-xs font-medium text-ink-400">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-ink-800">{children}</dd>
    </div>
  );
}

export function ExternalLink({ href, label }: { href: string | null; label?: string }) {
  if (!href) return <span className="text-ink-200">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-700 underline decoration-violet-200 underline-offset-2 hover:decoration-violet-500"
    >
      {label ?? "Open"}
    </a>
  );
}
