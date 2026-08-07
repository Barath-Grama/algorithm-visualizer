interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  leftHint?: string;
  rightHint?: string;
  valueLabel?: string;
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  leftHint,
  rightHint,
  valueLabel,
  disabled,
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
        <span className="mono text-xs text-[var(--color-text-primary)]">
          {valueLabel ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-accent)] disabled:cursor-not-allowed"
      />
      {(leftHint || rightHint) && (
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>{leftHint}</span>
          <span>{rightHint}</span>
        </div>
      )}
    </div>
  );
}
