import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon";
  size?: "sm" | "md";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<string, string> = {
  primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
  secondary:
    "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
  ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
  icon: "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] p-2",
};

const sizes: Record<string, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-4 py-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const sizeClass = variant === "icon" ? "" : sizes[size];
  return (
    <button className={`${base} ${variants[variant]} ${sizeClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
