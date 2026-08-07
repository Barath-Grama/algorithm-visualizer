import { useMemo, useState } from "react";
import { markerPath, seriesStyle, type ChartSeries, type Metric } from "@/lib/chartSeries";

const PAD = { top: 20, right: 92, bottom: 44, left: 68 };
const WIDTH = 780;
const HEIGHT = 420;

/** Round a max up to a clean tick value so the axis reads 0 / 50k / 100k. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function compact(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return value.toFixed(value < 10 ? 1 : 0).replace(/\.0$/, "");
}

export function ComplexityChart({
  series,
  metric,
  logScale,
}: {
  series: ChartSeries[];
  metric: Metric;
  logScale: boolean;
}) {
  const [hoverN, setHoverN] = useState<number | null>(null);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const { maxN, maxY, allN } = useMemo(() => {
    const ns = [...new Set(series.flatMap((s) => s.points.map((p) => p.n)))].sort(
      (a, b) => a - b
    );
    const ys = series.flatMap((s) => s.points.map((p) => p[metric]));
    return {
      maxN: Math.max(...ns, 1),
      maxY: niceCeiling(Math.max(...ys, 1)),
      allN: ns,
    };
  }, [series, metric]);

  // Log axes start at 1 rather than 0, which has no position on a log scale.
  const yScale = (v: number) => {
    if (!logScale) return PAD.top + plotH - (v / maxY) * plotH;
    const lo = Math.log10(1);
    const hi = Math.log10(Math.max(maxY, 10));
    const t = (Math.log10(Math.max(v, 1)) - lo) / (hi - lo);
    return PAD.top + plotH - t * plotH;
  };
  const xScale = (n: number) => PAD.left + (n / maxN) * plotW;

  const yTicks = useMemo(() => {
    if (!logScale) return [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxY);
    const ticks: number[] = [];
    for (let exp = 0; 10 ** exp <= Math.max(maxY, 10); exp++) ticks.push(10 ** exp);
    return ticks;
  }, [logScale, maxY]);

  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(allN.length / 6));
    return allN.filter((_, i) => i % step === 0 || i === allN.length - 1);
  }, [allN]);

  if (series.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        Select at least one algorithm to plot.
      </div>
    );
  }

  const hovered = hoverN === null ? null : series.map((s) => ({
    series: s,
    point: s.points.find((p) => p.n === hoverN),
  }));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Measured ${metric} versus input size for ${series
          .map((s) => s.name)
          .join(", ")}`}
      >
        {/* Gridlines: hairline, solid, one step off the surface. */}
        {yTicks.map((t) => (
          <line
            key={`grid-${t}`}
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke="var(--chart-grid)"
            strokeWidth={1}
          />
        ))}
        <line
          x1={PAD.left}
          x2={PAD.left + plotW}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          stroke="var(--chart-axis)"
          strokeWidth={1}
        />

        {yTicks.map((t) => (
          <text
            key={`ylab-${t}`}
            x={PAD.left - 10}
            y={yScale(t) + 4}
            textAnchor="end"
            fontSize={11}
            fill="var(--color-text-muted)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {compact(t)}
          </text>
        ))}
        {xTicks.map((n) => (
          <text
            key={`xlab-${n}`}
            x={xScale(n)}
            y={PAD.top + plotH + 20}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-text-muted)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {n}
          </text>
        ))}
        <text
          x={PAD.left + plotW / 2}
          y={HEIGHT - 6}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-secondary)"
        >
          input size (n)
        </text>

        {hoverN !== null && (
          <line
            x1={xScale(hoverN)}
            x2={xScale(hoverN)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="var(--chart-axis)"
            strokeWidth={1}
          />
        )}

        {series.map((s) => {
          const style = seriesStyle(s.id);
          const measured = s.points.map((p) => `${xScale(p.n)},${yScale(p[metric])}`).join(" ");
          // The fitted curve is sampled densely so its shape, not the sample
          // spacing, is what the reader sees.
          const fitted = s.fit
            ? Array.from({ length: 60 }, (_, i) => {
                const n = ((i + 1) / 60) * maxN;
                return `${xScale(n)},${yScale(s.fit!.scale * s.fit!.model.f(n))}`;
              }).join(" ")
            : "";

          return (
            <g key={s.id}>
              {fitted && (
                <polyline
                  points={fitted}
                  fill="none"
                  stroke={style.color}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  opacity={0.55}
                  strokeLinecap="round"
                />
              )}
              <polyline
                points={measured}
                fill="none"
                stroke={style.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.points.map((p) => (
                <path
                  key={p.n}
                  d={markerPath(style.shape, 4.5)}
                  transform={`translate(${xScale(p.n)},${yScale(p[metric])})`}
                  fill={style.color}
                  /* 2px surface ring keeps overlapping markers legible. */
                  stroke="var(--color-bg)"
                  strokeWidth={2}
                />
              ))}
            </g>
          );
        })}

        {/* Direct end-labels supplement the legend; capped so they never stack. */}
        {series.length <= 4 &&
          series.map((s) => {
            const last = s.points.at(-1)!;
            return (
              <text
                key={`end-${s.id}`}
                x={xScale(last.n) + 10}
                y={yScale(last[metric]) + 4}
                fontSize={11}
                fill="var(--color-text-secondary)"
              >
                {s.fit?.model.label ?? ""}
              </text>
            );
          })}

        {/* Invisible hit bands: hover targets far wider than the markers. */}
        {allN.map((n, i) => {
          const prev = allN[i - 1] ?? n;
          const next = allN[i + 1] ?? n;
          const x1 = xScale((prev + n) / 2);
          const x2 = xScale((n + next) / 2);
          return (
            <rect
              key={`hit-${n}`}
              x={x1}
              y={PAD.top}
              width={Math.max(x2 - x1, 8)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHoverN(n)}
              onMouseLeave={() => setHoverN(null)}
            />
          );
        })}
      </svg>

      {hovered && hoverN !== null && (
        <div
          className="pointer-events-none absolute rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[11px] shadow-lg"
          style={{
            left: `${((xScale(hoverN) + 12) / WIDTH) * 100}%`,
            top: 12,
            maxWidth: 220,
          }}
        >
          <div className="mb-1 font-semibold text-[var(--color-text-primary)]">n = {hoverN}</div>
          {hovered.map(({ series: s, point }) => (
            <div key={s.id} className="flex items-center gap-2 whitespace-nowrap">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: seriesStyle(s.id).color }}
              />
              <span className="text-[var(--color-text-secondary)]">{s.name}</span>
              <span
                className="ml-auto font-semibold text-[var(--color-text-primary)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {point ? Math.round(point[metric]).toLocaleString() : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
