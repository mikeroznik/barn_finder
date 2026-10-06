/** Read-only star display, e.g. 4.3 → ★★★★☆ with a label for screen readers. */
export function Stars({ value, size = "text-base" }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={`whitespace-nowrap ${size}`} aria-label={`${value.toFixed(1)} out of 5`} role="img">
      <span className="text-accent">{"★".repeat(rounded)}</span>
      <span className="text-border">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
