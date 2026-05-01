import { NextRequest, NextResponse } from "next/server";
import {
  streamChatCompletion,
  chatCompletion,
  type ChatMessage,
} from "@/lib/0g/compute";

/** Use the Node.js runtime so we can stream responses */
export const runtime = "nodejs";

/**
 * POST /api/0g/chat
 *
 * Accepts a JSON body with:
 *   - messages: ChatMessage[]  — the conversation history
 *   - stream: boolean          — whether to use SSE streaming (default: true)
 *
 * The x-user-address header is passed through for server-side logging only.
 * All 0G Compute fees are paid by the admin wallet — never the user.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON body
    const body = await req.json();
    const { messages, stream = true } = body as {
      messages: ChatMessage[];
      stream?: boolean;
    };

    // Validate that messages is a non-empty array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Extract the optional user address header (for server-side logs only)
    const userAddress = req.headers.get("x-user-address") ?? undefined;

    if (stream) {
      // Stream SSE chunks back to the client in real time
      const readableStream = await streamChatCompletion(messages, userAddress);
      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Return the full response as a single JSON object
      const result = await chatCompletion(messages);
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    // Extract the error message — this may contain the friendly retry message
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/chat] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
