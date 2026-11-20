"use client";

import { useState } from "react";
import { cx } from "@/components/ui";

/**
 * Multi-select rendered as toggle chips backed by real checkboxes, so the
 * values post with the form as repeated entries and arrive as a Postgres array.
 */
export function CheckboxGroup({
  name,
  options,
  defaultValues = [],
  disabled,
}: {
  name: string;
  options: string[];
  defaultValues?: string[];
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValues);

  // Keep any saved value that is no longer in the shared vocabulary.
  const all = [...options, ...defaultValues.filter((v) => !options.includes(v))];

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
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
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-400",
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
