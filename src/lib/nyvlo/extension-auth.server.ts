// Server-only auth resolver for desktop app + browser extension endpoints.
// Accepts either:
//   - A Supabase access token (preferred, modern flow)
//   - A legacy `nyv_...` extension token (kept temporarily for migration)
//
// Returns { userId } on success, or null on auth failure.
import { adminClient } from "@/lib/nyvlo/google.server";

export async function resolveExtensionAuth(
  authHeader: string | null,
): Promise<{ userId: string } | null> {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const supabase = adminClient();

  // Legacy nyv_ token path (extension_tokens table)
  if (token.startsWith("nyv_")) {
    const { data } = await supabase
      .from("extension_tokens")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();
    if (!data) return null;
    // Best-effort last_used update
    supabase
      .from("extension_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token)
      .then(() => {}, () => {});
    return { userId: data.user_id };
  }

  // Supabase JWT path
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { userId: data.user.id };
}
