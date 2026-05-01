import { NextRequest, NextResponse } from "next/server";
import { transferToProvider } from "@/lib/0g/accounts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, providerAddress } = body as {
      amount: number;
      providerAddress?: string;
    };

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid positive amount is required" },
        { status: 400 }
      );
    }

    await transferToProvider(amount, providerAddress);

    return NextResponse.json({
      success: true,
      transferred: amount,
      message: `Transferred ${amount} 0G to provider sub-account`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/account/transfer] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
