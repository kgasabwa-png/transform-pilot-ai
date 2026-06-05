// LiveTicker — the headline metric, shared across surfaces. Counts up
// in a smooth tween whenever the value changes. This is the product
// proof: every shipped motion adds to a visible number.

import { useEffect, useRef, useState } from "react";

export function LiveTicker({
  value,
  label,
  tone = "default",
  prefix = "$",
  suffix = "",
  formatter,
}: {
  value: number;
  label: string;
  tone?: "default" | "success" | "danger";
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const from = prev.current;
    const to = value;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const formatted = formatter
    ? formatter(display)
    : `${prefix}${Math.round(display).toLocaleString()}${suffix}`;

  const toneCls =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "";

  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-display font-semibold tracking-tight tabular-nums text-2xl sm:text-3xl ${toneCls}`}
      >
        {formatted}
      </div>
    </div>
  );
}

// Compact inline counter for chrome strips
export function InlineCounter({
  value,
  label,
  prefix = "$",
  suffix = "",
  formatter,
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const from = prev.current;
    const to = value;
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const formatted = formatter
    ? formatter(display)
    : `${prefix}${Math.round(display).toLocaleString()}${suffix}`;

  return (
    <span className="inline-flex items-baseline gap-1.5 font-mono text-xs">
      <span className="text-muted-foreground uppercase tracking-[0.14em]">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{formatted}</span>
    </span>
  );
}
