import { adminClient } from "@/lib/nyvlo/google.server";

export async function logIngestionError(args: {
  endpoint: string;
  userId?: string | null;
  statusCode?: number;
  error: string;
  context?: Record<string, unknown>;
}) {
  try {
    await adminClient()
      .from("ingestion_errors")
      .insert({
        endpoint: args.endpoint,
        user_id: args.userId ?? null,
        status_code: args.statusCode ?? null,
        error_message: args.error.slice(0, 1000),
        context: (args.context ?? {}) as any,
      });
  } catch {
    // never throw from a logger
  }
}
