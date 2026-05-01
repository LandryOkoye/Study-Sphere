import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/0g/compute";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topicTitle, subject = "Physics" } = body as {
      topicTitle: string;
      subject?: string;
    };

    if (!topicTitle) {
      return NextResponse.json(
        { error: "topicTitle is required" },
        { status: 400 }
      );
    }

    /**
     * BILLING: The ADMIN wallet pays for this inference via the server-side
     * broker. The user address is read from the request header for logging only.
     */
    const userAddress = req.headers.get("x-user-address") ?? undefined;

    const systemPrompt = `You are an expert ${subject} tutor for Senior Secondary students preparing for WAEC and JAMB exams.

Generate a comprehensive, well-structured lesson on the given topic. Your response MUST include:

1. **Introduction** — Brief overview of the topic and why it matters
2. **Key Concepts** — Core definitions and principles with clear explanations
3. **Formulas & Equations** — All relevant formulas with variable definitions (use LaTeX notation like $v = u + at$)
4. **Worked Examples** — At least 2 solved examples showing step-by-step solutions
5. **Key Takeaways** — Summary of the most important points for exam preparation
6. **Practice Questions** — 3 practice questions for self-assessment

Use markdown formatting for structure. Be thorough but accessible for secondary school students.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `Generate a complete lesson on: "${topicTitle}"`,
      },
    ];

    const result = await chatCompletion(messages, userAddress);

    return NextResponse.json({
      content: result.content,
      usage: result.usage,
      topicTitle,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/chat/topic] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}