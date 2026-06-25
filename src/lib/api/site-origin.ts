import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";

const DEFAULT_REDIRECT_ORIGIN = "https://transform-pilot-ai.lovable.app";

export function siteOrigin() {
  const host = getRequestHost();
  if (!host || host.includes("lovableproject.com") || host.includes("id-preview--")) {
    return DEFAULT_REDIRECT_ORIGIN;
  }
  const fwdProto = getRequestHeader("x-forwarded-proto");
  const proto = fwdProto ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
