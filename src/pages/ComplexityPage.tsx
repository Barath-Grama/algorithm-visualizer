import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Badge, Panel, Select } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { ComplexityChart } from "@/components/charts/ComplexityChart";
import { getAlgorithm } from "@/lib/algorithmRegistry";
import { formatR2, parseComplexity } from "@/lib/curveFit";
import { MEASURABLE_IDS, defaultSizes, type MeasurableId } from "@/lib/measureAlgorithm";
import {
  DEFAULT_SELECTION,
  METRIC_LABELS,
  buildSeries,
  markerPath,
  seriesStyle,
  type Metric,
} from "@/lib/chartSeries";
import { useComplexitySweep } from "@/hooks/useComplexitySweep";

export function ComplexityPage() {
  const [selected, setSelected] = useState<MeasurableId[]>(DEFAULT_SELECTION);
  const [maxN, setMaxN] = useState(400);
  const [trials, setTrials] = useState(3);
  const [metric, setMetric] = useState<Metric>("comparisons");
  const [logScale, setLogScale] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [searchCase, setSearchCase] = useState<"absent" | "present">("absent");

  const sweep = useComplexitySweep();
  const sizes = useMemo(() => defaultSizes(maxN, 14), [maxN]);

  // Measure once on mount so the page has something to show immediately.
  useEffect(() => {
    sweep.run([...MEASURABLE_IDS], defaultSizes(400, 14), 3, {
      searchTargetMode: "absent",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const series = useMemo(
    () => buildSeries(sweep.results, selected, metric),
    [sweep.results, selected, metric]
  );

  const toggle = (id: MeasurableId) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  const pct =
    sweep.progress.total === 0
      ? 0
      : Math.round((sweep.progress.completed / sweep.progress.total) * 100);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={15} />
          Visualizer
        </Link>
        <div className="h-4 w-px bg-[var(--color-border)]" />
        <h1 className="text-base font-semibold">Complexity Lab</h1>
        <Badge tone="accent">Empirical</Badge>
        <span className="ml-auto text-[12px] text-[var(--color-text-muted)]">
          {sweep.status === "done"
            ? `${sweep.progress.total} runs in ${sweep.elapsedMs.toLocaleString()}ms`
            : sweep.status === "running"
            ? `Measuring… ${pct}%`
            : ""}
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={`Measured ${METRIC_LABELS[metric].toLowerCase()} vs input size`}>
            <div className="p-4">
              <p className="mb-3 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                Solid lines are measured operation counts, averaged over {trials} seeded
                inputs per size. Dashed lines are the best-fitting growth curve, chosen by
                least squares across O(1) … O(2ⁿ) and scored by R².
              </p>

              {sweep.status === "running" && (
                <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              {sweep.status === "error" ? (
                <p className="py-12 text-center text-sm text-[var(--color-swap)]">
                  Measurement failed: {sweep.error}
                </p>
              ) : (
                <ComplexityChart series={series} metric={metric} logScale={logScale} />
              )}

              {/* A legend is always present for two or more series. */}
              {series.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {series.map((s) => {
                    const style = seriesStyle(s.id);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]"
                      >
                        <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true">
                          <path d={markerPath(style.shape, 4.5)} fill={style.color} />
                        </svg>
                        {s.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Declared vs measured"
            action={
              <button
                onClick={() => setShowTable((v) => !v)}
                className="text-[11px] text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
              >
                {showTable ? "Hide raw data" : "Show raw data"}
              </button>
            }
          >
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[560px] text-left text-[12px]">
                <thead>
                  <tr className="text-[var(--color-text-muted)]">
                    <th className="pb-2 font-medium">Algorithm</th>
                    <th className="pb-2 font-medium">Declared (avg)</th>
                    <th className="pb-2 font-medium">Best fit</th>
                    <th className="pb-2 font-medium">R²</th>
                    <th className="pb-2 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody className="mono">
                  {series.map((s) => {
                    const declared = getAlgorithm(s.id)!.complexity.average;
                    const expected = parseComplexity(declared);
                    const matches = expected && s.fit && expected.key === s.fit.model.key;
                    return (
                      <tr key={s.id} className="border-t border-[var(--color-border)]">
                        <td className="py-2 pr-4 text-[var(--color-text-primary)]">{s.name}</td>
                        <td className="py-2 pr-4 text-[var(--color-text-secondary)]">
                          {declared}
                        </td>
                        <td className="py-2 pr-4 text-[var(--color-text-primary)]">
                          {s.fit?.model.label ?? "—"}
                        </td>
                        <td
                          className="py-2 pr-4 text-[var(--color-text-secondary)]"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {s.fit ? formatR2(s.fit.r2) : "—"}
                        </td>
                        <td className="py-2">
                          {matches ? (
                            <span className="text-[var(--color-sorted)]">✓ matches</span>
                          ) : (
                            <span className="text-[var(--color-compare)]">differs</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {showTable && (
                <table className="mono mt-4 w-full min-w-[560px] text-left text-[11px]">
                  <thead>
                    <tr className="text-[var(--color-text-muted)]">
                      <th className="pb-1 font-medium">n</th>
                      {series.map((s) => (
                        <th key={s.id} className="pb-1 font-medium">
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
                    {sizes.map((n) => (
                      <tr key={n} className="border-t border-[var(--color-border)]">
                        <td className="py-1 text-[var(--color-text-secondary)]">{n}</td>
                        {series.map((s) => {
                          const point = s.points.find((p) => p.n === n);
                          return (
                            <td key={s.id} className="py-1 text-[var(--color-text-primary)]">
                              {point ? Math.round(point[metric]).toLocaleString() : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Algorithms">
            <div className="flex flex-col gap-1.5 p-4">
              {MEASURABLE_IDS.map((id) => {
                const style = seriesStyle(id);
                const isOn = selected.includes(id);
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(id)}
                      className="accent-[var(--color-accent)]"
                    />
                    <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true">
                      <path
                        d={markerPath(style.shape, 4.5)}
                        fill={isOn ? style.color : "var(--color-text-muted)"}
                      />
                    </svg>
                    <span
                      className={
                        isOn ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                      }
                    >
                      {getAlgorithm(id)?.name ?? id}
                    </span>
                  </label>
                );
              })}
            </div>
          </Panel>

          <Panel title="Sweep">
            <div className="flex flex-col gap-3 p-4">
              <Select
                label="Metric"
                value={metric}
                onChange={(v) => setMetric(v as Metric)}
                options={(Object.keys(METRIC_LABELS) as Metric[]).map((m) => ({
                  value: m,
                  label: METRIC_LABELS[m],
                }))}
              />
              <Slider
                label="Max input size"
                value={maxN}
                min={50}
                max={1200}
                step={50}
                onChange={setMaxN}
                rightHint="larger n = clearer separation"
              />
              <Slider
                label="Trials per size"
                value={trials}
                min={1}
                max={9}
                onChange={setTrials}
                rightHint="averaged to smooth noise"
              />
              <Select
                label="Search case"
                value={searchCase}
                onChange={(v) => setSearchCase(v as "absent" | "present")}
                options={[
                  { value: "absent", label: "Worst case (target absent)" },
                  { value: "present", label: "Average (target present)" },
                ]}
              />
              <Select
                label="Y axis"
                value={logScale ? "log" : "linear"}
                onChange={(v) => setLogScale(v === "log")}
                options={[
                  { value: "linear", label: "Linear" },
                  { value: "log", label: "Logarithmic" },
                ]}
              />

              <Button
                variant="primary"
                onClick={() =>
                  sweep.run([...MEASURABLE_IDS], sizes, trials, {
                    searchTargetMode: searchCase,
                  })
                }
                disabled={sweep.status === "running"}
                className="w-full"
              >
                {sweep.status === "running" ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" /> Measuring…
                  </>
                ) : (
                  <>
                    <Play size={14} /> Run sweep
                  </>
                )}
              </Button>

              <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                Runs in a Web Worker, so the page stays responsive while measuring. Only
                sorting and searching appear here — graph, DP and backtracking algorithms
                run on fixed sample inputs, so there is no single n to sweep against.
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                Searches are measured on the miss path by default: a successful search
                stops at a data-dependent point, so its counts scatter and fit no clean
                curve. The miss is the well-defined worst case.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
