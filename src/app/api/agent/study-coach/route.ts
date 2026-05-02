import { NextRequest, NextResponse } from "next/server";
import { handleStudyAgentOperation } from "@/lib/agent/studyCoach";
import type { StudyAgentContext, StudyAgentOperation, StudyAgentState } from "@/lib/agent/types";

export const runtime = "nodejs";

type StudyAgentRequestBody = {
  state?: StudyAgentState | null;
  context?: StudyAgentContext;
  operation?: StudyAgentOperation;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StudyAgentRequestBody;
    const { state, context, operation } = body;

    if (!context || !operation) {
      return NextResponse.json(
        { error: "context and operation are required" },
        { status: 400 }
      );
    }

    if (!context.subjectId || !context.subjectName || !Array.isArray(context.availableTopics)) {
      return NextResponse.json(
        { error: "invalid agent context" },
        { status: 400 }
      );
    }

    const result = await handleStudyAgentOperation({
      state,
      context,
      operation,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /agent/study-coach] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
