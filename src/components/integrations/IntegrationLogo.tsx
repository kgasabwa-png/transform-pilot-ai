// Tiny inline wordmarks for each integration. We can't ship vendor
// logos, so we render the first 2 chars in their own monogram chip —
// deliberately uniform so the row reads as a system, not a logo soup.

export function IntegrationLogo({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-md bg-foreground/[0.04] border border-border flex items-center justify-center font-mono text-[11px] tracking-tight text-foreground/80 shrink-0"
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
