// useClientStamp — hydration-safe live timestamp. Server renders a
// placeholder so SSR HTML matches; the real time only paints after mount.

import { useEffect, useState } from "react";
import { shortStamp } from "./time";

export function useClientStamp(fallback = "—") {
  const [s, setS] = useState(fallback);
  useEffect(() => {
    setS(shortStamp());
    const t = setInterval(() => setS(shortStamp()), 60_000);
    return () => clearInterval(t);
  }, []);
  return s;
}
