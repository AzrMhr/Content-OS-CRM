"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table, Td, Th, cx } from "@/components/ui";
import type { FormatPoint, WeekPoint } from "@/lib/aggregate";
import { shortNum, usd } from "@/lib/format";

/* Colours come from CSS custom properties, so each chart re-steps itself for
   the dark surface without a second set of components. The two series hues are
   validated for colour-vision deficiency and for contrast against both
   surfaces — see the palette note in the README before changing them. */
const SERIES_1 = "var(--color-chart-1)";
const SERIES_2 = "var(--color-chart-2)";
const GRID = "var(--color-chart-grid)";
const AXIS = "var(--color-chart-axis)";

const AXIS_TICK = { fill: AXIS, fontSize: 11 } as const;

/** Shared shell: title, an optional legend, and a table view for the data. */
function ChartFrame({
  title,
  description,
  legend,
  children,
  table,
  footnote,
}: {
  title: string;
  description?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  table: React.ReactNode;
  footnote?: string;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="self-start rounded-xl border border-ink-100 bg-surface shadow-[0_1px_2px_rgb(18_19_23_/_0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-400">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {legend}
          <button
            type="button"
            onClick={() => setShowTable((open) => !open)}
            aria-expanded={showTable}
            className="text-xs text-ink-400 underline decoration-ink-200 underline-offset-2 hover:text-ink-900"
          >
            {showTable ? "Hide data" : "Show data"}
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="px-0 py-0">{table}</div>
      ) : (
        <>
          <div className="p-4 pb-2">{children}</div>
          {footnote && <p className="px-5 pb-3 text-xs text-ink-400">{footnote}</p>}
        </>
      )}
    </section>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-600">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

/** Tooltip body. Values wear text tokens; the swatch carries the identity. */
function TipShell({
  label,
  rows,
}: {
  label: string;
  rows: { color?: string; name: string; value: string }[];
}) {
  return (
    <div className="rounded-lg border border-ink-100 bg-surface px-2.5 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink-900">{label}</p>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2">
            {row.color && (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
            )}
            <span className="text-ink-400">{row.name}</span>
            <span className="ml-auto tabular-nums text-ink-900">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Views posted per week — one series, so no legend; the title names it.
// ---------------------------------------------------------------------------

export function ViewsTrend({ data }: { data: WeekPoint[] }) {
  const hasData = data.some((point) => point.views > 0);

  return (
    <ChartFrame
      title="Views by week"
      description="Posted content, last 12 weeks."
      footnote="The final week is still running, so its bar is partial."
      table={
        <Table>
          <thead>
            <tr>
              <Th>Week of</Th>
              <Th align="right">Posts</Th>
              <Th align="right">Views</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.week}>
                <Td>{point.label}</Td>
                <Td align="right">{point.posts}</Td>
                <Td align="right">{point.views.toLocaleString("en-US")}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      }
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              stroke={GRID}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={AXIS_TICK}
              stroke={GRID}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => shortNum(value)}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipShell
                    label={`Week of ${label}`}
                    rows={[
                      { name: "Views", value: shortNum(Number(payload[0]?.value ?? 0)) },
                      {
                        name: "Posts",
                        value: String((payload[0]?.payload as WeekPoint | undefined)?.posts ?? 0),
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke={SERIES_1}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty message="No view counts on posted content yet." />
      )}
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------
// Spend against revenue — two series, same unit, so one shared axis.
// ---------------------------------------------------------------------------

export function SpendRevenueTrend({ data }: { data: WeekPoint[] }) {
  const hasData = data.some((point) => point.spend > 0 || point.revenue > 0);

  return (
    <ChartFrame
      title="Ad spend and revenue by week"
      description="Both in dollars, on one axis."
      footnote="The final week is still running, so its figures are partial."
      legend={
        <span className="flex gap-3">
          <LegendSwatch color={SERIES_1} label="Spend" />
          <LegendSwatch color={SERIES_2} label="Revenue" />
        </span>
      }
      table={
        <Table>
          <thead>
            <tr>
              <Th>Week of</Th>
              <Th align="right">Spend</Th>
              <Th align="right">Revenue</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.week}>
                <Td>{point.label}</Td>
                <Td align="right">{usd(point.spend)}</Td>
                <Td align="right">{usd(point.revenue)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      }
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              stroke={GRID}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={AXIS_TICK}
              stroke={GRID}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(value: number) => usd(value)}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipShell
                    label={`Week of ${label}`}
                    rows={payload.map((entry) => ({
                      color: entry.name === "Revenue" ? SERIES_2 : SERIES_1,
                      name: String(entry.name),
                      value: usd(Number(entry.value ?? 0)),
                    }))}
                  />
                ) : null
              }
            />
            <Line
              type="monotone"
              name="Spend"
              dataKey="spend"
              stroke={SERIES_1}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
            />
            <Line
              type="monotone"
              name="Revenue"
              dataKey="revenue"
              stroke={SERIES_2}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty message="No ad spend recorded yet. Add spend and revenue to paid pieces." />
      )}
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------
// Average views by format — ranked bars on one baseline, single hue.
// ---------------------------------------------------------------------------

export function FormatPerformance({ data }: { data: FormatPoint[] }) {
  return (
    <ChartFrame
      title="Average views by format"
      description="Across posted content. A piece tagged twice counts in both."
      table={
        <Table>
          <thead>
            <tr>
              <Th>Format</Th>
              <Th align="right">Posts</Th>
              <Th align="right">Average views</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.format}>
                <Td>{point.format}</Td>
                <Td align="right">{point.posts}</Td>
                <Td align="right">{point.avgViews.toLocaleString("en-US")}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      }
    >
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34 + 24)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
            barCategoryGap={6}
          >
            <CartesianGrid stroke={GRID} strokeWidth={1} horizontal={false} />
            <XAxis
              type="number"
              tick={AXIS_TICK}
              stroke={GRID}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => shortNum(value)}
            />
            <YAxis
              type="category"
              dataKey="format"
              tick={AXIS_TICK}
              stroke={GRID}
              tickLine={false}
              axisLine={false}
              width={132}
            />
            <Tooltip
              cursor={{ fill: GRID, fillOpacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload as FormatPoint | undefined;
                if (!point) return null;
                return (
                  <TipShell
                    label={point.format}
                    rows={[
                      { name: "Average views", value: shortNum(point.avgViews) },
                      { name: "Posts", value: String(point.posts) },
                    ]}
                  />
                );
              }}
            />
            {/* Rounded data-end only; the bar stays anchored to the baseline. */}
            <Bar dataKey="avgViews" fill={SERIES_1} radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty message="Tag posted content with formats and add view counts to compare them." />
      )}
    </ChartFrame>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className={cx("px-1 py-12 text-center text-sm text-ink-400")}>{message}</p>
  );
}
