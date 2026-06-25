type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export function corsHeaders(...methods: HttpMethod[]): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": methods.join(", "),
  };
}

export function optionsHandler(headers: Record<string, string>): () => Promise<Response> {
  return async () => new Response(null, { status: 204, headers });
}
