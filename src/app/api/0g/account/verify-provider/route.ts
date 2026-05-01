import { NextRequest, NextResponse } from "next/server";
import { getBroker } from "@/lib/0g/broker";

/**
 * GET /api/0g/account/verify-provider?address=0x...
 *
 * Diagnostic endpoint — checks whether a provider address is registered
 * on the 0G Compute Network by trying to fetch its service metadata.
 */
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Read the provider address from the query string
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address query parameter is required" },
      { status: 400 }
    );
  }

  console.log(`[Verify Provider] Checking if ${address} is registered on 0G...`);

  try {
    const broker = await getBroker();

    // Try to fetch service metadata — this will fail if the provider isn't registered
    const metadata = await broker.inference.getServiceMetadata(address);

    console.log(`[Verify Provider] ✅ Provider IS registered:`);
    console.log(`  Endpoint: ${metadata.endpoint}`);
    console.log(`  Model: ${metadata.model}`);

    return NextResponse.json({
      registered: true,
      address,
      endpoint: metadata.endpoint,
      model: metadata.model,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Verify Provider] ❌ Provider NOT registered or error: ${msg}`);

    return NextResponse.json({
      registered: false,
      address,
      error: msg,
    });
  }
}
