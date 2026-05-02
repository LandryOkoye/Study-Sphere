"use client";

import { useState, useRef, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { UploadCloud, FileText, SendHorizontal, TerminalSquare, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/context/WalletContext";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type UploadedFile = {
  name: string;
  rootHash: string;
  size: number;
};

export function AIChat({
  hideUpload,
  sectionId,
  onAutoCreateSection
}: {
  hideUpload?: boolean;
  sectionId?: string | null;
  onAutoCreateSection?: (msg: string) => Promise<string>;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Connection established. Ask any clarifying questions about the current topic.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * BILLING: The user's wallet address is read here purely to attach it as a
   * request header (x-user-address) so the server can log which user triggered
   * which inference. The server-side ADMIN wallet pays all 0G fees — the user's
   * address is NEVER used for signing, payment, or any blockchain operation.
   */
  const { address: userAddress } = useWallet();

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load messages from localStorage when sectionId changes
  useEffect(() => {
    if (sectionId) {
      const stored = localStorage.getItem(`chat_msgs_${sectionId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: "Workspace chat initialized. Let's research."
          }
        ]);
      }
    } else {
      // Default / empty state
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Connection established. Ask any clarifying questions about the current topic."
        }
      ]);
    }
  }, [sectionId]);

  // Save messages to localStorage when they change (if sectionId is set)
  useEffect(() => {
    if (sectionId && messages.length > 0) {
      localStorage.setItem(`chat_msgs_${sectionId}`, JSON.stringify(messages));
    }
  }, [messages, sectionId]);

  // ─── Streaming Chat ────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    let activeContextId = sectionId;

    // Auto-create section if none exists
    if (!activeContextId && onAutoCreateSection) {
      activeContextId = await onAutoCreateSection(userMessage);
    }

    // Build message history for the API (skip the initial system greeting)
    const apiMessages = [
      ...messages
        .filter((m) => m.id !== "1")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMessage },
    ];

    // Prepend uploaded-file context if any files are attached
    if (uploadedFiles.length > 0) {
      const fileContext = uploadedFiles
        .map((f) => `[Uploaded: ${f.name} | Hash: ${f.rootHash}]`)
        .join("\n");
      apiMessages.unshift({
        role: "system" as const,
        content: `The student has uploaded the following files to 0G Storage:\n${fileContext}\nHelp them understand the content related to their current curriculum topic.`,
      });
    }

    // Always inject a system prompt to format beautifully and restrict emojis
    apiMessages.unshift({
      role: "system" as const,
      content: "You are a helpful, professional AI assistant for StudentBud. Structure your responses beautifully using Markdown headers (#), subheaders (##), sub-subheaders (###), bold text (**), italics (*), and bullet points where appropriate. Use LaTeX formatting for mathematical expressions: wrap inline math with `$` and display block math with `$$`. Make your responses look engaging but do NOT use too many emojis. Keep your tone professional.",
    });

    const assistantMsgId = (Date.now() + 1).toString();

    try {
      // Build request headers — user address is for server logging only, not billing
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (userAddress) {
        requestHeaders["x-user-address"] = userAddress;
      }

      const response = await fetch("/api/0g/chat", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      // Create the assistant message shell to stream into
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      // Parse the SSE stream chunk by chunk
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          try {
            const jsonStr = trimmed.startsWith("data:")
              ? trimmed.slice(5).trim()
              : trimmed;
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }

      // Fallback message if model returned empty content
      if (!accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                ...m,
                content:
                  // "I received your message but the model returned an empty response. This might be a provider issue — try again.",
                  "Model is currently unavailable. Please try again later."
              }
              : m
          )
        );
      }
    } catch (err: unknown) {
      // Log the raw error to the console for debugging purposes
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AIChat] Chat request failed:", errMsg);

      // Show a friendly, non-technical message to the user in the chat
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content:
            "😔 Oops! Our AI assistant is temporarily unavailable. Please try again in a moment.",
        },
      ]);
    } finally {
      // Always stop the typing indicator, whether the request succeeded or failed
      setIsTyping(false);
    }
  };

  // ─── File Upload to 0G Storage ─────────────────────────
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/0g/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      setUploadedFiles((prev) => [
        ...prev,
        { name: data.fileName, rootHash: data.rootHash, size: data.size },
      ]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDropzoneClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = ""; // Reset so same file can be re-selected
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="flex flex-col h-full">
      {/* Docs Dropzone */}
      {!hideUpload && (
        <div className="p-4 border-b border-charcoal/50 bg-muted">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div
            role="button"
            onClick={handleDropzoneClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              "border border-dashed border-charcoal hover:border-accent-blue/50 bg-card rounded-sm p-4 text-center cursor-pointer transition-colors group",
              isUploading && "opacity-60 pointer-events-none"
            )}
          >
            <UploadCloud className="w-5 h-5 mx-auto mb-2 text-foreground/40 group-hover:text-accent-blue" />
            <p className="text-xs font-medium">
              {isUploading ? "Uploading..." : "Upload Notes/PDF"}
            </p>
            <p className="text-[10px] text-foreground/40 mt-1">
              Saves to decentralized storage
            </p>
          </div>

          {uploadError && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{uploadError}</span>
            </div>
          )}

          {uploadedFiles.map((file, i) => (
            <div
              key={i}
              className="mt-3 flex items-center gap-3 p-2 bg-charcoal/30 border border-charcoal rounded-sm"
            >
              <FileText className="w-4 h-4 text-accent-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-[10px] font-mono text-foreground/40 truncate">
                  Hash: {file.rootHash.slice(0, 16)}...{file.rootHash.slice(-8)}
                </p>
              </div>
              <Check className="w-3.5 h-3.5 text-accent-green flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col max-w-[90%]",
              m.role === "user" ? "self-end items-end" : "self-start"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono  tracking-wider text-foreground/40">
                {m.role === "user" ? "You" : "Ai"}
              </span>
            </div>
            <div
              className={cn(
                "px-3 py-2 rounded-sm text-sm border",
                m.role === "user"
                  ? "bg-charcoal/40 text-foreground border-charcoal/80 whitespace-pre-wrap"
                  : "bg-muted border-charcoal/40 text-foreground/90 w-full"
              )}
            >
              {m.role === "user" ? (
                m.content
              ) : (
                <MarkdownRenderer content={m.content} />
              )}
            </div>
          </div>
        ))}

        {isTyping && (messages.length === 0 || messages[messages.length - 1]?.content !== "") && (
          <div className="self-start flex flex-col max-w-[90%]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent-green/80 animate-pulse">
                Getting data...
              </span>
            </div>
            <div className="px-3 py-3 rounded-sm border bg-muted border-charcoal/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce delay-300" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-charcoal/50 bg-muted">
        <form onSubmit={handleSend} className="relative flex items-center">
          <TerminalSquare className="w-4 h-4 absolute left-3 text-foreground/30" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Prompt inference..."
            className="w-full h-10 bg-card border border-charcoal focus:border-accent-green/50 rounded-sm pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-accent-green/50 transition-colors placeholder:text-foreground/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-1.5 rounded-sm hover:bg-charcoal disabled:opacity-50 transition-colors"
          >
            <SendHorizontal className="w-4 h-4 text-foreground/80" />
          </button>
        </form>
      </div>
    </div>
  );
}
