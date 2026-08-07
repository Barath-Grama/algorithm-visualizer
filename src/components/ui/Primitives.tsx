import type { ReactNode } from "react";

// --- Badge -------------------------------------------------------------
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]",
    success: "bg-[#22c55e1a] text-[#4ade80]",
    warning: "bg-[#f5a5241a] text-[#facc15]",
    danger: "bg-[#f5455c1a] text-[#fb7185]",
    accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent-hover)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// --- Tabs ----------------------------------------------------------------
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-[var(--color-border)] px-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            active === t.id
              ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// --- Select ----------------------------------------------------------------
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// --- Panel container -------------------------------------------------------
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
