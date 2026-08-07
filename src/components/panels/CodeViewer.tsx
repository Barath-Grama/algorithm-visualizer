import { useState } from "react";
import { Tabs } from "@/components/ui/Primitives";
import type { AlgorithmMeta } from "@/types";

export function CodeViewer({
  algorithm,
  activeLines,
}: {
  algorithm: AlgorithmMeta;
  activeLines: number[];
}) {
  const [tab, setTab] = useState<"code" | "pseudocode" | "description" | "complexity">("pseudocode");

  // Steps report pseudocode line numbers; the Code tab shows a different text,
  // so those indices have to be translated rather than reused verbatim.
  const highlighted =
    tab === "code"
      ? activeLines.flatMap((line) => algorithm.codeLineMap[line] ?? [])
      : activeLines;

  return (
    <div className="flex h-full flex-col">
      <Tabs
        tabs={[
          { id: "pseudocode", label: "Pseudocode" },
          { id: "code", label: "Code" },
          { id: "description", label: "Description" },
          { id: "complexity", label: "Complexity" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {(tab === "code" || tab === "pseudocode") && (
          <CodeBlock text={tab === "code" ? algorithm.code : algorithm.pseudocode} activeLines={highlighted} />
        )}
        {tab === "description" && (
          <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            {algorithm.description}
          </p>
        )}
        {tab === "complexity" && (
          <div className="flex flex-col gap-2">
            {(["best", "average", "worst"] as const).map((k) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor:
                    k === "best" ? "#22c55e14" : k === "average" ? "#f5a52414" : "#f5455c14",
                }}
              >
                <span className="text-[13px] capitalize text-[var(--color-text-secondary)]">
                  {k} case
                </span>
                <span className="mono text-sm font-semibold text-[var(--color-text-primary)]">
                  {algorithm.complexity[k]}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--color-surface-raised)] px-3 py-2.5">
              <span className="text-[13px] text-[var(--color-text-secondary)]">Auxiliary space</span>
              <span className="mono text-sm font-semibold text-[var(--color-text-primary)]">
                {algorithm.complexity.space}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ text, activeLines }: { text: string; activeLines: number[] }) {
  const lines = text.split("\n");
  return (
    <pre className="mono overflow-x-auto text-[12.5px] leading-6">
      {lines.map((line, i) => {
        const lineNo = i + 1;
        const active = activeLines.includes(lineNo);
        return (
          <div
            key={i}
            className="flex rounded px-2 transition-colors"
            style={{ backgroundColor: active ? "var(--color-accent-soft)" : "transparent" }}
          >
            <span className="mr-4 w-5 shrink-0 select-none text-right text-[var(--color-text-muted)]">
              {lineNo}
            </span>
            <span
              style={{ color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
              className="whitespace-pre"
            >
              {line}
            </span>
          </div>
        );
      })}
    </pre>
  );
}
