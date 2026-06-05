// Minimal Receipts mark. A small filled square with a 1px receipt "tear"
// line on the right edge — quietly references both the brand name and the
// idea of cited evidence. Scales cleanly to favicon and 6px corners.

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Receipts"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <path
        d="M16.5 6 L16.5 8 L17.5 9 L16.5 10 L17.5 11 L16.5 12 L17.5 13 L16.5 14 L17.5 15 L16.5 16 L16.5 18"
        stroke="var(--background)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="12" r="1.6" fill="var(--background)" />
    </svg>
  );
}
