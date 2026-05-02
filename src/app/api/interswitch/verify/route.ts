import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txnRef = searchParams.get("ref");
  const amount = searchParams.get("amount");

  if (!txnRef || !amount) {
    return NextResponse.json(
      { error: "Missing required parameters: ref, amount" },
      { status: 400 }
    );
  }

  const merchantCode =
    (process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE || "").trim();

  // Use QA endpoint for TEST mode, switch to webpay.interswitchng.com for LIVE
  const baseUrl = "https://qa.interswitchng.com";
  const url = `${baseUrl}/collections/api/v1/gettransaction.json?merchantcode=${encodeURIComponent(
    merchantCode
  )}&transactionreference=${encodeURIComponent(
    txnRef
  )}&amount=${encodeURIComponent(amount)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to verify transaction with Interswitch" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Interswitch verification error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 }
    );
  }
}
