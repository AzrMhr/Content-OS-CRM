/** Small helpers for reading FormData, so actions stay readable. */

export function text(fd: FormData, key: string): string | null {
  const value = fd.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function requiredText(fd: FormData, key: string, label: string): string {
  const value = text(fd, key);
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

export function number(fd: FormData, key: string): number | null {
  const value = text(fd, key);
  if (value === null) return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function integer(fd: FormData, key: string): number | null {
  const value = number(fd, key);
  return value === null ? null : Math.round(value);
}

/** Date inputs give "" when empty, which Postgres rejects for a `date` column. */
export function date(fd: FormData, key: string): string | null {
  return text(fd, key);
}

export function list(fd: FormData, key: string): string[] {
  return fd
    .getAll(key)
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim());
}

/** For <select> where the empty option means "not set". */
export function enumValue<T extends string>(
  fd: FormData,
  key: string,
  allowed: readonly T[],
): T | null {
  const value = text(fd, key);
  if (!value) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function requiredEnum<T extends string>(
  fd: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  return enumValue(fd, key, allowed) ?? fallback;
}

/** Turn an unknown thrown value into a message a form can display. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Try again.";
}
