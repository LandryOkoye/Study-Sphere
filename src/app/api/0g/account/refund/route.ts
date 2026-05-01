import { NextRequest, NextResponse } from "next/server";
import { requestRefund, withdrawToWallet } from "@/lib/0g/accounts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount } = body as {
      action: "request" | "withdraw";
      amount?: number;
    };

    if (!action) {
      return NextResponse.json(
        { error: "action is required ('request' or 'withdraw')" },
        { status: 400 }
      );
    }

    switch (action) {
      case "request":
        await requestRefund();
        return NextResponse.json({
          success: true,
          message:
            "Refund requested — 24h lock period started. Call again with action='withdraw' after 24 hours.",
        });

      case "withdraw":
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: "Valid positive amount is required for withdrawal" },
            { status: 400 }
          );
        }
        await withdrawToWallet(amount);
        return NextResponse.json({
          success: true,
          withdrawn: amount,
          message: `Withdrew ${amount} 0G to wallet`,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use 'request' or 'withdraw'` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/account/refund] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
