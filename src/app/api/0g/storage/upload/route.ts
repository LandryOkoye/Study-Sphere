import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/0g/storage";
import * as path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || `upload-${Date.now()}`;

    console.log(
      `[API /0g/storage/upload] Uploading: ${filename} (${buffer.length} bytes)`
    );

    const result = await uploadBuffer(buffer, path.basename(filename));

    return NextResponse.json({
      rootHash: result.rootHash,
      fileName: filename,
      size: buffer.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/storage/upload] Error:", message);

    // Return a user-friendly message for blockchain / wallet errors
    const isChainError =
      message.includes("execution reverted") ||
      message.includes("insufficient funds") ||
      message.includes("already exist");

    return NextResponse.json(
      {
        error: isChainError
          ? "Storage upload failed — this may be a temporary blockchain issue. Please try again in a moment."
          : message,
        details: message,
      },
      { status: 500 }
    );
  }
}
