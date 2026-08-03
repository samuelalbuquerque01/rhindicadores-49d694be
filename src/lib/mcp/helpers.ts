import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

export function requireUserClient(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) return null;
  return supabaseForUser(ctx);
}

export function unauthenticated() {
  return {
    content: [{ type: "text" as const, text: "Not authenticated. Sign in to RH Insights to use this tool." }],
    isError: true,
  };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function jsonResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload as Record<string, unknown>,
  };
}
