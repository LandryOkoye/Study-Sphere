import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

/**
 * ADMIN-ONLY ACCOUNT MANAGEMENT
 *
 * All 0G Compute and Storage operations (deposits, transfers, inference fees)
 * are paid by the ADMIN wallet defined in server-side environment variables.
 *
 * Users who sign in via Google / MetaMask / OKX are NEVER billed. Their wallet
 * address is only used for identity (display, study tracking) — it is never
 * passed to any 0G SDK function and never signs any blockchain transaction.
 *
 * Fund flow (admin-side only):
 *   Admin Wallet (PRIVATE_KEY)
 *     └─▶ deposit ──▶ Main Ledger Account
 *                        └─▶ transferFund ──▶ Provider Sub-Account
 *                                               └─▶ inference fees auto-deducted per request
 *
 * These env vars are SERVER-SIDE ONLY (no NEXT_PUBLIC_ prefix).
 * They are never exposed to the browser.
 */

// Validate required env vars at import time — fail fast on misconfiguration
function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val.trim();
}

// Lazily cached singletons — initialised once per server process lifetime
let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _brokerPromise: ReturnType<typeof createZGComputeNetworkBroker> | null = null;

/**
 * Returns the shared JsonRpcProvider pointed at the 0G network RPC.
 * Uses the ADMIN's RPC_URL from server env.
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(requireEnv("RPC_URL"));
  }
  return _provider;
}

/**
 * Returns the ADMIN wallet used to sign all 0G transactions.
 * PRIVATE_KEY must belong to the admin/operator — never a user's key.
 */
export function getWallet(): ethers.Wallet {
  if (!_wallet) {
    _wallet = new ethers.Wallet(requireEnv("PRIVATE_KEY"), getProvider());
  }
  return _wallet;
}

/**
 * Returns the 0G Compute Network broker initialised with the ADMIN wallet.
 * All inference requests, fee settlements, and ledger operations go through
 * this broker — users are not involved at the blockchain level.
 */
export function getBroker() {
  if (!_brokerPromise) {
    _brokerPromise = createZGComputeNetworkBroker(getWallet());
  }
  return _brokerPromise;
}

/**
 * The 0G inference provider address the admin has set up a sub-account with.
 * Currently pointing to the Qwen2.5 provider (QWEN_PROVIDER_ADDRESS env var).
 */
export function getProviderAddress(): string {
  return requireEnv("QWEN_PROVIDER_ADDRESS");
}

/** The 0G Storage indexer URL for upload/download operations. */
export function getStorageIndexer(): string {
  return requireEnv("STORAGE_INDEXER");
}

/** The RPC URL (re-exported for storage SDK calls that need it directly). */
export function getRpcUrl(): string {
  return requireEnv("RPC_URL");
}