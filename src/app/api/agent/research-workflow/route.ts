import { NextRequest, NextResponse } from "next/server";
import { handleResearchAgentOperation } from "@/lib/research/agent";
import type {
  ResearchAgentContext,
  ResearchAgentOperation,
  ResearchAgentState,
} from "@/lib/research/types";

export const runtime = "nodejs";

type RequestBody = {
  state?: ResearchAgentState | null;
  context?: ResearchAgentContext;
  operation?: ResearchAgentOperation;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { state, context, operation } = body;

    if (!context || !operation) {
      return NextResponse.json(
        { error: "context and operation are required" },
        { status: 400 }
      );
    }

    const result = await handleResearchAgentOperation({
      state,
      context,
      operation,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /agent/research-workflow] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
