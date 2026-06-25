export function requireCronAuth(request: Request): Response | null {
  const apikey = request.headers.get("apikey");
  if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
