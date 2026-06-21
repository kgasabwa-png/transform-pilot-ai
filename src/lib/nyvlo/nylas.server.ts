import { createHmac, timingSafeEqual } from "crypto";

// Nylas v3 — US region. EU users would need api.eu.nylas.com.
const NYLAS_API = "https://api.us.nylas.com/v3";

export function nylasConfig() {
  const clientId = process.env.NYLAS_CLIENT_ID;
  const apiKey = process.env.NYLAS_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error("Nylas not configured: missing NYLAS_CLIENT_ID or NYLAS_API_KEY");
  }
  return { clientId, apiKey };
}

// Sign userId so we can verify it came back from us in the OAuth callback.
function signingSecret() {
  return process.env.NYLAS_API_KEY ?? "fallback-not-secure";
}

export function signState(userId: string): string {
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
}

export function verifyState(state: string): { userId: string } | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const expected = createHmac("sha256", signingSecret())
    .update(`${userId}.${ts}`)
    .digest("hex")
    .slice(0, 32);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  // Expire after 30 minutes
  if (Date.now() - Number(ts) > 30 * 60 * 1000) return null;
  return { userId };
}

export function buildAuthUrl(opts: { redirectUri: string; state: string; loginHint?: string }) {
  const { clientId } = nylasConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    provider: "google",
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state: opts.state,
  });
  if (opts.loginHint) params.set("login_hint", opts.loginHint);
  return `${NYLAS_API}/connect/auth?${params.toString()}`;
}

export interface NylasTokenResponse {
  grant_id: string;
  email: string;
  scope?: string;
  provider?: string;
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
}

export async function exchangeCodeForGrant(
  code: string,
  redirectUri: string,
): Promise<NylasTokenResponse> {
  const { clientId, apiKey } = nylasConfig();
  const res = await fetch(`${NYLAS_API}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: apiKey,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Nylas token exchange failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as NylasTokenResponse;
}

export async function deleteGrant(grantId: string): Promise<void> {
  const { apiKey } = nylasConfig();
  const res = await fetch(`${NYLAS_API}/grants/${grantId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  // 404 is fine — already gone.
  if (!res.ok && res.status !== 404) {
    const txt = await res.text();
    throw new Error(`Nylas grant delete failed: ${res.status} ${txt}`);
  }
}

export async function nylasFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { apiKey } = nylasConfig();
  const res = await fetch(`${NYLAS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Nylas ${path} failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}
