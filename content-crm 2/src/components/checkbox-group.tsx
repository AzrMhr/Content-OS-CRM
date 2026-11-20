"use client";

import { useState } from "react";
import { cx } from "@/components/ui";

/**
 * Multi-select rendered as toggle chips backed by real checkboxes, so the
 * values post with the form as repeated entries and arrive as a Postgres array.
 *
 * Pass `value` and `onChange` to control it from the parent (the content form
 * does, so the preview and the AI draft can see the current selection).
 * Otherwise it keeps its own state.
 */
export function CheckboxGroup({
  name,
  options,
  defaultValues = [],
  value,
  onChange,
  disabled,
}: {
  name: string;
  options: string[];
  defaultValues?: string[];
  value?: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [internal, setInternal] = useState<string[]>(defaultValues);
  const selected = value ?? internal;

  // Keep any saved value that is no longer in the shared vocabulary.
  const all = [...options, ...selected.filter((v) => !options.includes(v))];

  function toggle(option: string) {
    const next = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];

    if (onChange) onChange(next);
    else setInternal(next);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((option) => {
        const isOn = selected.includes(option);
        return (
          <label
            key={option}
            className={cx(
              "cursor-pointer select-none rounded-md border px-2 py-1 text-xs transition-colors",
              isOn
                ? "border-ink-900 bg-ink-900 text-ink-50"
                : "border-ink-200 bg-surface text-ink-600 hover:border-ink-400",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={isOn}
              disabled={disabled}
              onChange={() => toggle(option)}
              className="sr-only"
            />
            {option}
          </label>
        );
      })}
    </div>
  );
}
