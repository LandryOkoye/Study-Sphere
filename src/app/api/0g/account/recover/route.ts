import { NextRequest, NextResponse } from "next/server";
import { getWalletBalance } from "@/lib/0g/accounts";
import { getBroker } from "@/lib/0g/broker";
import { ethers } from "ethers";

export const runtime = "nodejs";

/**
 * Recovery endpoint. Tries multiple approaches to recover stuck ledger funds:
 * 1. Try refund(totalBalance) — may refund based on totalBalance even if availableBalance=0
 * 2. Try depositFund(0) — might reconcile the availableBalance
 * 3. Try deleteLedger — after reconciliation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "diagnose" } = body as { action?: string };
    const broker = await getBroker();
    const logs: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
    };

    // Get current state
    const walletBefore = await getWalletBalance();
    log(`Wallet balance: ${walletBefore} 0G`);

    const ledger = await broker.ledger.getLedger();
    const availableBalance = ethers.formatEther(ledger[1] as bigint);
    const totalBalance = ethers.formatEther(ledger[2] as bigint);
    log(`Ledger: available=${availableBalance}, total=${totalBalance}`);

    if (action === "diagnose") {
      return NextResponse.json({
        success: true,
        walletBalance: walletBefore,
        availableBalance,
        totalBalance,
        logs,
        suggestions: [
          "Try action='refund' — attempts to refund the totalBalance back to wallet",
          "Try action='deposit-then-delete' — deposits 0 to reconcile, then deletes",
          "Try action='force-refund' — tries refunding exact totalBalance amount in neuron",
        ],
      });
    }

    if (action === "refund") {
      // Try refunding the totalBalance amount
      const totalBn = ledger[2] as bigint;
      const totalHuman = parseFloat(ethers.formatEther(totalBn));
      log(`Attempting refund of ${totalHuman} 0G...`);
      try {
        await broker.ledger.refund(totalHuman);
        const walletAfter = await getWalletBalance();
        log(`Refund succeeded! Wallet: ${walletBefore} → ${walletAfter} 0G`);
        return NextResponse.json({ success: true, walletBefore, walletAfter, logs });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`Refund failed: ${msg}`);
      }
    }

    if (action === "deposit-then-delete") {
      // Try a minimal deposit to reconcile, then delete
      log("Step 1: Depositing 0.001 0G to reconcile...");
      try {
        await broker.ledger.depositFund(0.001);
        log("Deposit succeeded");
        const ledger2 = await broker.ledger.getLedger();
        log(`After deposit: available=${ethers.formatEther(ledger2[1] as bigint)}, total=${ethers.formatEther(ledger2[2] as bigint)}`);
      } catch (e: unknown) {
        log(`Deposit failed: ${e instanceof Error ? e.message : String(e)}`);
      }

      log("Step 2: Attempting delete...");
      try {
        await broker.ledger.deleteLedger();
        const walletAfter = await getWalletBalance();
        log(`Delete succeeded! Wallet: ${walletBefore} → ${walletAfter} 0G`);
        return NextResponse.json({ success: true, walletBefore, walletAfter, logs });
      } catch (e: unknown) {
        log(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (action === "force-refund") {
      // Try refunding through the contract directly with the raw neuron value
      const totalBn = ledger[2] as bigint;
      log(`Attempting direct refund of ${totalBn.toString()} neuron (${ethers.formatEther(totalBn)} 0G)...`);
      try {
        // Use the lower-level contract directly
        const ledgerWithDetail = await (broker.ledger as any).getLedgerWithDetail();
        log(`getLedgerWithDetail: ${JSON.stringify(ledgerWithDetail, (_, v) => typeof v === 'bigint' ? v.toString() : v)}`);
      } catch (e: unknown) {
        log(`getLedgerWithDetail failed: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Try refund with raw amount
      try {
        await broker.ledger.refund(parseFloat(ethers.formatEther(totalBn)));
        const walletAfter = await getWalletBalance();
        log(`Refund succeeded! Wallet: ${walletBefore} → ${walletAfter} 0G`);
        return NextResponse.json({ success: true, walletBefore, walletAfter, logs });
      } catch (e: unknown) {
        log(`Refund failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const walletAfter = await getWalletBalance();
    return NextResponse.json({
      success: false,
      walletBefore,
      walletAfter,
      logs,
      message: "Recovery attempt completed — check logs for details",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /0g/account/recover] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
