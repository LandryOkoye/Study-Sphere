import { NextResponse } from "next/server";
import {
  getMainBalance,
  getSubAccount,
  getWalletBalance,
} from "@/lib/0g/accounts";
import { getProviderAddress } from "@/lib/0g/broker";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [walletBalance, mainAccount, subAccount] = await Promise.allSettled([
      getWalletBalance(),
      getMainBalance(),
      getSubAccount(),
    ]);

    return NextResponse.json({
      providerAddress: getProviderAddress(),
      walletBalance:
        walletBalance.status === "fulfilled"
          ? walletBalance.value
          : null,
      walletError:
        walletBalance.status === "rejected"
          ? walletBalance.reason?.message
          : null,
      mainAccount:
        mainAccount.status === "fulfilled"
          ? mainAccount.value
          : null,
      mainAccountError:
        mainAccount.status === "rejected"
          ? mainAccount.reason?.message
          : null,
      subAccount:
        subAccount.status === "fulfilled"
          ? subAccount.value
          : null,
      subAccountError:
        subAccount.status === "rejected"
          ? subAccount.reason?.message
          : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/account/balance] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
