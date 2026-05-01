import { ZgFile, Indexer } from "@0gfoundation/0g-ts-sdk";
import { getWallet, getStorageIndexer, getRpcUrl } from "./broker";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const MAX_UPLOAD_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 3000;

export async function uploadFile(filePath: string): Promise<{
  rootHash: string;
  tx: string | null;
}> {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const stats = fs.statSync(filePath);
  if (stats.size === 0) throw new Error("Cannot upload empty file");

  const indexer = new Indexer(getStorageIndexer());
  const wallet = getWallet();
  const file = await ZgFile.fromFilePath(filePath);

  try {
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash() as string;
    console.log("[0G Storage] Root hash:", rootHash);

    const uploadOpts = {
      tags: "0x" as `0x${string}`,
      finalityRequired: true,
      taskSize: 10,
      expectedReplica: 1,
      skipTx: true,
      fee: BigInt(0),
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
      try {
        const [tx, uploadErr] = await indexer.upload(
          file,
          getRpcUrl(),
          wallet as any,
          uploadOpts
        );

        if (uploadErr) {
          // Specific check for the contract-revert / estimateGas error
          if (
            uploadErr.message.includes("execution reverted") ||
            uploadErr.message.includes("estimateGas") ||
            uploadErr.message.includes("require(false)")
          ) {
            console.warn(
              `[0G Storage] Transaction reverted (attempt ${attempt}/${MAX_UPLOAD_RETRIES}). ` +
                "The file may already exist on-chain or the wallet balance is too low."
            );
            lastError = uploadErr;
            // Wait before retrying
            if (attempt < MAX_UPLOAD_RETRIES) {
              await delay(RETRY_BASE_DELAY_MS * attempt);
              continue;
            }
            throw new Error(
              "Upload transaction failed — the file may already exist on-chain " +
                "or the admin wallet has insufficient funds. " +
                `Details: ${uploadErr.message}`
            );
          }
          throw new Error(`Upload failed: ${uploadErr.message}`);
        }

        console.log("[0G Storage] Upload tx:", tx);
        const txStr =
          typeof tx === "string" ? tx : tx ? JSON.stringify(tx) : null;
        return { rootHash, tx: txStr };
      } catch (err: unknown) {
        lastError =
          err instanceof Error ? err : new Error(String(err));

        // Retry on transient network / gas errors
        const msg = lastError.message;
        const isTransient =
          msg.includes("ETIMEDOUT") ||
          msg.includes("ECONNREFUSED") ||
          msg.includes("nonce") ||
          msg.includes("replacement fee too low");

        if (isTransient && attempt < MAX_UPLOAD_RETRIES) {
          console.warn(
            `[0G Storage] Transient error (attempt ${attempt}/${MAX_UPLOAD_RETRIES}): ${msg}`
          );
          await delay(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }
        throw lastError;
      }
    }

    // Should not reach here, but just in case
    throw lastError ?? new Error("Upload failed after all retries");
  } finally {
    await file.close();
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a Buffer to 0G Storage (writes to temp file first).
 */
export async function uploadBuffer(
  data: Buffer,
  filename: string
): Promise<{ rootHash: string }> {
  const tempPath = path.join(
    os.tmpdir(),
    `0g-upload-${Date.now()}-${filename}`
  );
  fs.writeFileSync(tempPath, data);

  try {
    const result = await uploadFile(tempPath);
    return { rootHash: result.rootHash };
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

/**
 * Download a file from 0G Storage using its root hash (with Merkle verification).
 */
export async function downloadFile(
  rootHash: string,
  outputPath: string
): Promise<void> {
  // Validate root hash format
  if (!rootHash.startsWith("0x") || rootHash.length < 10) {
    throw new Error("Invalid root hash format");
  }

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const indexer = new Indexer(getStorageIndexer());

  try {
    const err = await indexer.download(rootHash, outputPath, true);
    if (err) throw err;
    console.log(`[0G Storage] Downloaded and verified: ${outputPath}`);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    if (message.includes("not found") || message.includes("JsonRpc")) {
      throw new Error(`File not found for root hash: ${rootHash}`);
    }
    throw error;
  }
}

/**
 * Compute the Merkle root hash of a local file (for verification).
 */
export async function computeRootHash(filePath: string): Promise<string> {
  const file = await ZgFile.fromFilePath(filePath);
  try {
    const [tree, err] = await file.merkleTree();
    if (err) throw new Error(`Merkle tree error: ${err}`);
    return tree!.rootHash() as string;
  } finally {
    await file.close();
  }
}
