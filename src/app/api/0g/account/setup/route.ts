import { NextRequest, NextResponse } from "next/server";
import { setupProvider } from "@/lib/0g/accounts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      depositAmount = 10,
      transferAmount = 5,
      providerAddress,
    } = body as {
      depositAmount?: number;
      transferAmount?: number;
      providerAddress?: string;
    };

    const result = await setupProvider(
      depositAmount,
      transferAmount,
      providerAddress
    );

    return NextResponse.json({
      success: true,
      ...result,
      message: `Provider setup complete. Deposited ${result.deposited} 0G, transferred ${result.transferred} 0G, and acknowledged provider.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/account/setup] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
