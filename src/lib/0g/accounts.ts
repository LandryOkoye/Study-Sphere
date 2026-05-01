import { ethers } from "ethers";
import { getBroker, getProviderAddress, getWallet, getProvider } from "./broker";


export type AccountBalance = {
  address: string;
  availableBalance: string;
  totalBalance: string;
  availableBalanceRaw: string;
  totalBalanceRaw: string;
};

export type SubAccountInfo = {
  user: string;
  provider: string;
  balance: string;
  balanceRaw: string;
  pendingRefunds: Array<Record<string, unknown>>;
};

/**
 * Get the main 0G Compute ledger account balance.
 */
export async function getMainBalance(): Promise<AccountBalance> {
  const broker = await getBroker();
  const account = await broker.ledger.getLedger();

  // Struct: [user, availableBalance, totalBalance, additionalInfo]
  return {
    address: account[0] as string,
    availableBalance: ethers.formatEther(account[1] as bigint),
    totalBalance: ethers.formatEther(account[2] as bigint),
    availableBalanceRaw: (account[1] as bigint).toString(),
    totalBalanceRaw: (account[2] as bigint).toString(),
  };
}

/**
 * Get the wallet's native token balance (for gas fees).
 */
export async function getWalletBalance(): Promise<string> {
  const provider = getProvider();
  const wallet = getWallet();
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

/**
 * Get sub-account info for a specific provider.
 */
export async function getSubAccount(
  providerAddress?: string
): Promise<SubAccountInfo> {
  const broker = await getBroker();
  const addr = providerAddress || getProviderAddress();

  const [subAccount, refunds] =
    await broker.inference.getAccountWithDetail(addr);

  return {
    user: subAccount[0] as string,
    provider: subAccount[1] as string,
    balance: ethers.formatEther(subAccount[2] as bigint),
    balanceRaw: (subAccount[2] as bigint).toString(),
    pendingRefunds: refunds.map((r: unknown) => {
      if (typeof r === "object" && r !== null) {
        return r as Record<string, unknown>;
      }
      return { value: String(r) };
    }),
  };
}

/**
 * Deposit funds from wallet to 0G Compute main account.
 * Uses addLedger for first-time creation, depositFund for subsequent deposits.
 */
export async function depositFunds(amount: number): Promise<void> {
  const broker = await getBroker();

  // Check if ledger exists by trying to get it
  let ledgerExists = false;
  try {
    const ledger = await broker.ledger.getLedger();
    if (ledger && ledger[0] !== ethers.ZeroAddress) {
      ledgerExists = true;
    }
  } catch {
    // Ledger doesn't exist yet
  }

  if (!ledgerExists) {
    // First time: use addLedger to create ledger with initial balance
    console.log(`[0G Account] Creating ledger with initial balance of ${amount} 0G`);
    await broker.ledger.addLedger(amount);
    console.log(`[0G Account] Ledger created with ${amount} 0G`);
  } else {
    // Subsequent: use depositFund
    console.log(`[0G Account] Depositing ${amount} 0G to existing ledger`);
    await broker.ledger.depositFund(amount);
    console.log(`[0G Account] Deposited ${amount} 0G`);
  }
}

/**
 * Transfer funds from main account to provider sub-account.
 */
export async function transferToProvider(
  amount: number,
  providerAddress?: string
): Promise<void> {
  const broker = await getBroker();
  const addr = providerAddress || getProviderAddress();
  const transferAmount = ethers.parseEther(String(amount));

  console.log(`[0G Transfer] Attempting transfer:`);
  console.log(`  Provider: ${addr}`);
  console.log(`  Amount (human): ${amount} 0G`);
  console.log(`  Amount (wei): ${transferAmount.toString()}`);

  try {
    await broker.ledger.transferFund(addr, "inference", transferAmount);
    console.log(
      `[0G Account] Transferred ${amount} 0G to provider ${addr}`
    );
  } catch (err: unknown) {
    const error = err as Record<string, unknown>;
    console.error(`[0G Transfer] REVERT details:`);
    console.error(`  Message: ${error.message || error}`);
    console.error(`  Code: ${error.code}`);
    throw err;
  }
}

export async function setupProvider(
  depositAmount: number,
  transferAmount: number,
  providerAddress?: string
): Promise<{
  deposited: number;
  transferred: number;
  provider: string;
}> {
  const broker = await getBroker();
  const addr = providerAddress || getProviderAddress();

  console.log(`[0G Setup] Starting provider setup for: ${addr}`);
  console.log(`[0G Setup] Deposit: ${depositAmount} 0G, Transfer: ${transferAmount} 0G`);

  // ── Step 1: Acknowledge provider signer (required before any transfers) ──
  console.log(`[0G Setup] Step 1/3: Acknowledging provider signer...`);
  try {
    await broker.inference.acknowledgeProviderSigner(addr);
    console.log(`[0G Setup] ✅ Provider ${addr} acknowledged successfully`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Many contract errors don't contain friendly strings. 
    // Usually, a revert here just means the provider is already acknowledged.
    // So we treat it as a warning and intentionally DO NOT throw.
    console.warn(`[0G Setup]  Step 1 Acknowledge threw an error, but this is often normal (already acknowledged): ${msg}`);
    console.warn(`[0G Setup]  Continuing to Step 2 anyway...`);
  }

  // ── Step 2: Deposit to main ledger account (skip if 0) ──
  if (depositAmount > 0) {
    console.log(`[0G Setup] Step 2/3: Depositing ${depositAmount} 0G to main ledger...`);
    try {
      await depositFunds(depositAmount);
      console.log(`[0G Setup]  Deposited ${depositAmount} 0G`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[0G Setup]  Step 2 FAILED — deposit reverted: ${msg}`);
      throw new Error(`Setup failed at Step 2 (deposit): ${msg}`);
    }
  } else {
    console.log(`[0G Setup] Step 2/3: Skipping deposit (amount = 0)`);
  }

  // Debug: dump raw account state before transfer so we can verify the balance
  try {
    const rawAccount = await broker.ledger.getLedger();
    console.log(`[0G Setup] Ledger state before transfer:`);
    console.log(`  availableBalance: ${ethers.formatEther(rawAccount[1] as bigint)} 0G`);
    console.log(`  totalBalance:     ${ethers.formatEther(rawAccount[2] as bigint)} 0G`);
  } catch (e) {
    console.error(`[0G Setup] Could not read ledger state:`, e);
  }

  // ── Step 3: Transfer to provider sub-account (skip if 0) ──
  if (transferAmount > 0) {
    console.log(`[0G Setup] Step 3/3: Transferring ${transferAmount} 0G to provider sub-account...`);
    try {
      await transferToProvider(transferAmount, addr);
      console.log(`[0G Setup]  Transferred ${transferAmount} 0G to ${addr}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[0G Setup]  Step 3 FAILED — transfer reverted: ${msg}`);
      throw new Error(`Setup failed at Step 3 (transfer to provider): ${msg}`);
    }
  } else {
    console.log(`[0G Setup] Step 3/3: Skipping transfer (amount = 0)`);
  }

  console.log(`[0G Setup] Provider setup complete!`);
  return {
    deposited: depositAmount,
    transferred: transferAmount,
    provider: addr,
  };
}

/**
 * Acknowledge a provider signer (standalone — required before first transfer).
 */
export async function acknowledgeProvider(
  providerAddress?: string
): Promise<void> {
  const broker = await getBroker();
  const addr = providerAddress || getProviderAddress();
  await broker.inference.acknowledgeProviderSigner(addr);
  console.log(`[0G Account] Provider ${addr} acknowledged`);
}

/**
 * Request a refund from provider sub-account (starts 24h lock period).
 */
export async function requestRefund(): Promise<void> {
  const broker = await getBroker();
  await broker.ledger.retrieveFund("inference");
  console.log("[0G Account] Refund requested — 24h lock period started");
}

/**
 * Withdraw funds from main account back to wallet.
 */
export async function withdrawToWallet(amount: number): Promise<void> {
  const broker = await getBroker();
  await broker.ledger.refund(amount);
  console.log(`[0G Account] Withdrew ${amount} 0G to wallet`);
}

/**
 * Delete and recreate the ledger with initial balance.
 * Use this if the ledger is in a broken state (e.g. availableBalance=0).
 * Logs wallet balance before/after to confirm token refund.
 */
export async function resetLedger(initialBalance: number): Promise<{
  walletBefore: string;
  walletAfter: string;
  refunded: string;
}> {
  const broker = await getBroker();

  // Track wallet balance before deletion
  const walletBefore = await getWalletBalance();
  console.log(`[0G Reset] Wallet balance BEFORE delete: ${walletBefore} 0G`);

  // 1. Delete existing ledger (should refund deposited tokens)
  try {
    console.log("[0G Reset] Deleting existing ledger...");
    await broker.ledger.deleteLedger();
    console.log("[0G Reset] Ledger deleted successfully");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[0G Reset] Delete result: ${msg}`);
  }

  // Check wallet balance after deletion
  const walletAfterDelete = await getWalletBalance();
  const refunded = (parseFloat(walletAfterDelete) - parseFloat(walletBefore)).toFixed(4);
  console.log(`[0G Reset] Wallet balance AFTER delete: ${walletAfterDelete} 0G`);
  console.log(`[0G Reset] Refunded: ${refunded} 0G`);

  // 2. Create new ledger with initial balance (if requested)
  if (initialBalance > 0) {
    console.log(`[0G Reset] Creating new ledger with ${initialBalance} 0G...`);
    await broker.ledger.addLedger(initialBalance);
    console.log(`[0G Reset] New ledger created with ${initialBalance} 0G`);
  }

  // 3. Verify the new state
  const walletAfter = await getWalletBalance();
  try {
    const ledger = await broker.ledger.getLedger();
    console.log(`[0G Reset] New ledger state:`);
    console.log(`  availableBalance: ${ethers.formatEther(ledger[1] as bigint)} 0G`);
    console.log(`  totalBalance: ${ethers.formatEther(ledger[2] as bigint)} 0G`);
  } catch (e) {
    console.log("[0G Reset] No ledger exists (this is OK if initialBalance was 0)");
  }
  console.log(`[0G Reset] Final wallet balance: ${walletAfter} 0G`);

  return {
    walletBefore,
    walletAfter,
    refunded,
  };
}

