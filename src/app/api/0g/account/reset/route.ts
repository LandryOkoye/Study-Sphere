import { NextRequest, NextResponse } from "next/server";
import { resetLedger } from "@/lib/0g/accounts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initialBalance = 0 } = body as { initialBalance?: number };

    const result = await resetLedger(initialBalance);

    return NextResponse.json({
      success: true,
      walletBefore: result.walletBefore,
      walletAfter: result.walletAfter,
      refunded: result.refunded,
      message: `Ledger reset. Wallet: ${result.walletBefore} → ${result.walletAfter} 0G (refunded: ${result.refunded} 0G)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/account/reset] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
