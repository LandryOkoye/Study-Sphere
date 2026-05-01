import { NextRequest, NextResponse } from "next/server";
import { downloadFile } from "@/lib/0g/storage";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rootHash } = body as { rootHash: string };

    if (!rootHash) {
      return NextResponse.json(
        { error: "rootHash is required" },
        { status: 400 }
      );
    }

    const tempPath = path.join(os.tmpdir(), `0g-download-${Date.now()}`);

    await downloadFile(rootHash, tempPath);

    // Read the downloaded file and return it
    const fileBuffer = fs.readFileSync(tempPath);
    const stats = fs.statSync(tempPath);

    // Clean up
    fs.unlinkSync(tempPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": stats.size.toString(),
        "Content-Disposition": `attachment; filename="0g-${rootHash.slice(0, 10)}"`,
        "X-Root-Hash": rootHash,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/storage/download] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
