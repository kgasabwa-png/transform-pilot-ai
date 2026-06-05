// Real-time strings derived from `new Date()` so nothing ever reads stale.
// No hardcoded months or weekdays anywhere in the product.

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function nowParts(d = new Date()) {
  // Use UTC so SSR and browser hydration render the same stamp even when
  // the preview server and viewer are in different timezones.
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const h12 = ((hours + 11) % 12) + 1;
  const ampm = hours < 12 ? "a" : "p";
  return {
    weekday: WEEKDAY[d.getUTCDay()],
    month: MONTH[d.getUTCMonth()],
    date: d.getUTCDate(),
    year: d.getUTCFullYear(),
    time: `${h12}:${String(minutes).padStart(2, "0")}${ampm}`,
  };
}

// "Fri Jun 5" — date-only to avoid SSR/client minute drift during hydration.
export function shortStamp(d = new Date()) {
  const p = nowParts(d);
  return `${p.weekday} ${p.month} ${p.date}`;
}

// "Jun 5"
export function dateStamp(d = new Date()) {
  const p = nowParts(d);
  return `${p.month} ${p.date}`;
}

// e.g. 2h ago, 14m ago, 3d ago. Past only.
export function relativeAgo(when: Date | number, now: Date = new Date()) {
  const t = typeof when === "number" ? when : when.getTime();
  const diffMs = now.getTime() - t;
  const sec = Math.max(1, Math.round(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 8) return `${wk}w ago`;
  const mo = Math.round(day / 30);
  return `${mo}mo ago`;
}

// "this morning at 6:14a", "overnight", "earlier today"
export function descriptiveTime(d: Date, now: Date = new Date()) {
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  if (!sameDay) return relativeAgo(d, now);
  const hr = d.getUTCHours();
  const t = nowParts(d).time;
  if (hr < 5) return `overnight · ${t}`;
  if (hr < 10) return `this morning · ${t}`;
  if (hr < 13) return `late morning · ${t}`;
  if (hr < 17) return `this afternoon · ${t}`;
  return `this evening · ${t}`;
}

// Quarter the date sits in: returns "Q2", "Q3", etc.
export function currentQuarter(d = new Date()) {
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

// A deterministic past-Date offset from now, used to seed sample
// timestamps that always read as "recent" no matter when the demo runs.
export function minutesAgo(min: number, now: Date = new Date()) {
  return new Date(now.getTime() - min * 60_000);
}
export function hoursAgo(hr: number, now: Date = new Date()) {
  return minutesAgo(hr * 60, now);
}
export function daysAgo(days: number, now: Date = new Date()) {
  return minutesAgo(days * 60 * 24, now);
}
