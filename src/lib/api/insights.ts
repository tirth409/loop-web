import type { AskLoopPayload, AskLoopResponse } from "@/lib/types";
import { mockAskLoopResponse } from "@/lib/mock/data";

export async function askLoop(payload: AskLoopPayload): Promise<AskLoopResponse> {
  // IMPORTANT: In production, this calls /api/insights/ask — a server-side
  // route that proxies to the AI provider. Never expose AI API keys client-side.
  await new Promise((r) => setTimeout(r, 1800));
  return mockAskLoopResponse(payload.question);
}
