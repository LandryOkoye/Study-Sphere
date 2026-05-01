import { getBroker, getProviderAddress } from "./broker";

/**
 * BILLING MODEL:
 * Every request through this module is paid by the ADMIN's 0G sub-account.
 * The optional `userIdentifier` parameter is purely for server-side logging
 * so you can see which user triggered which inference — it is NEVER passed
 * to the 0G SDK and has no effect on billing or authentication.
 */

/** Shape of a single chat message sent to the model. */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/* ─── Retry Configuration ─────────────────────────────────────────────── */

/** Maximum number of fetch attempts before giving up. */
const MAX_RETRIES = 3;

/** Delay (in milliseconds) between retry attempts. */
const RETRY_DELAY_MS = 1000;

/** Per-request timeout (in milliseconds) before aborting. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * User-friendly error message shown when all retry attempts are exhausted.
 * This avoids exposing raw network errors to the end user.
 */
const FRIENDLY_OFFLINE_MSG =
  "Our AI assistant is temporarily unavailable. Please try again in a moment.";

/* ─── Retry Helper ─────────────────────────────────────────────────────── */

/**
 * Performs a fetch request with automatic retry logic.
 *
 * @param url       The endpoint URL to fetch.
 * @param options   Standard RequestInit options (method, headers, body, etc.).
 * @param endpoint  The provider endpoint base URL — used only for logging.
 * @returns         The successful Response object.
 * @throws          A user-friendly error after all retries are exhausted.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  endpoint: string
): Promise<Response> {
  /** Tracks the last error so we can log it if all retries fail. */
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create a per-attempt abort controller so each try gets a fresh timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      // Perform the actual fetch with the abort signal attached
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      // Clear the timeout since the request completed in time
      clearTimeout(timeout);

      // Return the response immediately on success
      return response;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      // Log the failure for server-side debugging
      console.warn(
        `[0G Compute] Attempt ${attempt}/${MAX_RETRIES} failed for ${endpoint}: ${msg}`
      );

      // If we haven't exhausted retries yet, wait before trying again
      if (attempt < MAX_RETRIES) {
        console.log(
          `[0G Compute] Retrying in ${RETRY_DELAY_MS}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  // All retries exhausted — log the raw error and throw a friendly message
  const rawMsg =
    lastError instanceof Error ? lastError.message : String(lastError);
  console.error(
    `[0G Compute] All ${MAX_RETRIES} attempts failed for ${endpoint}. Last error: ${rawMsg}`
  );
  throw new Error(FRIENDLY_OFFLINE_MSG);
}

/* ─── Non-Streaming Chat ───────────────────────────────────────────────── */

/**
 * Non-streaming chat completion via 0G Compute.
 *
 * @param messages        The conversation messages to send to the model.
 * @param userIdentifier  Optional — a user address or ID for server logs only.
 *                        Has no billing effect whatsoever.
 * @returns The full response text and token usage data.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  userIdentifier?: string
): Promise<{ content: string; usage: Record<string, unknown> }> {
  // Initialise the broker and resolve the current provider address
  const broker = await getBroker();
  const providerAddress = getProviderAddress();

  // Log which user triggered the inference (for monitoring only, not billing)
  if (userIdentifier) {
    console.log(`[0G Compute] Inference requested by user: ${userIdentifier}`);
  }

  // Fetch the provider's endpoint URL and model name from the smart contract
  const { endpoint, model } =
    await broker.inference.getServiceMetadata(providerAddress);

  // getRequestHeaders signs the request with the ADMIN wallet — user is not involved
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  console.log(`[0G Compute] Calling ${endpoint}/chat/completions (model: ${model})`);

  // Perform the fetch with automatic retry logic
  const response = await fetchWithRetry(
    `${endpoint}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ messages, model }),
    },
    endpoint
  );

  // Handle non-2xx HTTP responses from the provider
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`0G Compute error (${response.status}): ${errText}`);
  }

  // Parse the JSON response body
  const data = await response.json();
  const content = data.choices[0].message.content;

  // Extract chat ID from header first (primary), fall back to body id
  let chatID: string | undefined =
    response.headers.get("ZG-Res-Key") ??
    response.headers.get("zg-res-key") ??
    undefined;
  if (!chatID) chatID = data.id;

  // CRITICAL: processResponse settles the fee from the ADMIN's sub-account
  await broker.inference.processResponse(
    providerAddress,
    chatID!,
    JSON.stringify(data.usage)
  );

  return { content, usage: data.usage };
}

/* ─── Streaming Chat ───────────────────────────────────────────────────── */

/**
 * Streaming chat completion via 0G Compute.
 *
 * @param messages        The conversation messages.
 * @param userIdentifier  Optional — for server-side logs only, not billed.
 * @returns A ReadableStream emitting SSE-formatted chunks.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  userIdentifier?: string
): Promise<ReadableStream<Uint8Array>> {
  // Initialise the broker and resolve the current provider address
  const broker = await getBroker();
  const providerAddress = getProviderAddress();

  // Log the requesting user (for monitoring only, billing uses the admin wallet)
  if (userIdentifier) {
    console.log(`[0G Compute] Streaming inference requested by user: ${userIdentifier}`);
  }

  // Fetch the provider's endpoint URL and model name from the smart contract
  const { endpoint, model } =
    await broker.inference.getServiceMetadata(providerAddress);

  // Admin wallet signs the request headers — users are not billed
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  console.log(`[0G Compute] Streaming from ${endpoint}/chat/completions (model: ${model})`);

  // Perform the fetch with automatic retry logic
  const response = await fetchWithRetry(
    `${endpoint}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ messages, model, stream: true }),
    },
    endpoint
  );

  // Handle non-2xx HTTP responses from the provider
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`0G Compute error (${response.status}): ${errText}`);
  }

  // Capture chat ID from response header (most reliable source for streaming)
  const headerChatID: string | undefined =
    response.headers.get("ZG-Res-Key") ??
    response.headers.get("zg-res-key") ??
    undefined;

  // Set up stream readers/writers for piping SSE data to the client
  const upstreamReader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Accumulate the raw SSE body so we can extract chatID and usage at the end
  let rawBody = "";
  let streamChatID: string | null = null;
  let usage: Record<string, unknown> | null = null;

  return new ReadableStream({
    async pull(controller) {
      try {
        // Read the next chunk from the upstream provider stream
        const { done, value } = await upstreamReader.read();

        if (done) {
          // Stream finished — parse accumulated body for fallback chatID and usage
          for (const line of rawBody.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            try {
              const jsonStr = trimmed.startsWith("data:")
                ? trimmed.slice(5).trim()
                : trimmed;
              const message = JSON.parse(jsonStr);
              // Capture the chat ID from the first chunk that has one
              if (!streamChatID && message.id) streamChatID = message.id;
              // Capture usage data if the provider included it
              if (message.usage) usage = message.usage;
            } catch {
              // Skip unparseable SSE lines (e.g. keep-alive comments)
            }
          }

          // Settle fee from ADMIN sub-account after stream completes
          const finalChatID = headerChatID || streamChatID;
          if (finalChatID) {
            try {
              await broker.inference.processResponse(
                providerAddress,
                finalChatID,
                JSON.stringify(usage || {})
              );
            } catch (e) {
              console.error("[0G Compute] processResponse error:", e);
            }
          }

          // Signal end-of-stream to the client and close the controller
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // Decode and forward the chunk to the client in real time
        const chunk = decoder.decode(value, { stream: true });
        rawBody += chunk;
        controller.enqueue(encoder.encode(chunk));
      } catch (err) {
        // Propagate stream errors to the client
        controller.error(err);
      }
    },
    cancel() {
      // Clean up the upstream reader if the client disconnects
      upstreamReader.cancel();
    },
  });
}