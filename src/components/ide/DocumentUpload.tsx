"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, FileText, X, Bot, AlertCircle, Check } from "lucide-react";
import type { ResearchWorkspaceDocument } from "@/lib/research/types";

type DocumentUploadProps = {
  workspaceId: string | null;
  documents: ResearchWorkspaceDocument[];
  onAutoCreateWorkspace?: (seed: string) => Promise<string>;
  onDocumentAdded: (doc: ResearchWorkspaceDocument) => void;
  onDocumentRemoved: (id: string) => void;
  onDocumentNotesChange: (id: string, notes: string) => void;
};

export function DocumentUpload({
  workspaceId,
  documents,
  onAutoCreateWorkspace,
  onDocumentAdded,
  onDocumentRemoved,
  onDocumentNotesChange,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      let activeWorkspaceId = workspaceId;
      if (!activeWorkspaceId && onAutoCreateWorkspace) {
        activeWorkspaceId = await onAutoCreateWorkspace(file.name);
      }

      if (!activeWorkspaceId) {
        throw new Error("Create or select a research workspace before uploading.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/0g/storage/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      onDocumentAdded({
        id: `doc-${Date.now()}`,
        name: data.fileName,
        rootHash: data.rootHash,
        size: data.size,
        uploadedAt: Date.now(),
        notes: "",
      });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <aside className="w-full bg-muted flex flex-col h-full overflow-hidden border-l border-charcoal/50">
      <div className="p-4 border-b border-charcoal/30 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-foreground/50">Environment Documents</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Upload sources, then add short notes so the research agent can build a literature map.
          </p>
        </div>
        {workspaceId && (
          <Link
            href={`/research-agent?workspace=${workspaceId}`}
            className="h-8 px-3 rounded-sm border border-accent-blue/20 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-3 h-3" />
            Research Agent
          </Link>
        )}
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-charcoal/50 rounded-sm hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-colors cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-6 h-6 text-foreground/40 group-hover:text-accent-blue mb-2" />
            <p className="mb-1 text-sm text-foreground/70"><span className="font-medium">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-foreground/40">PDF, DOCX, TXT</p>
          </div>
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>

        {isUploading && <p className="text-xs text-accent-blue mt-2 font-mono animate-pulse">Uploading to 0G Storage...</p>}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <h3 className="text-xs font-mono tracking-wider text-foreground/50 mb-2">UPLOADED FILES</h3>

          {documents.length === 0 && (
            <div className="text-center text-sm text-foreground/40 py-8">
              No documents uploaded yet.
            </div>
          )}

          {documents.map((doc) => (
            <div key={doc.id} className="p-3 border border-charcoal bg-obsidian rounded-sm flex flex-col gap-3">
              <div className="flex items-start justify-between group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-charcoal/50 rounded-sm">
                    <FileText className="w-4 h-4 text-foreground/70" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium line-clamp-1 truncate">{doc.name}</h4>
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-foreground/45">
                      <Check className="w-3 h-3 text-accent-green" />
                      <span>{doc.rootHash.slice(0, 12)}...{doc.rootHash.slice(-8)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDocumentRemoved(doc.id)}
                  className="text-foreground/30 hover:text-red-400 transition-colors mt-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={doc.notes}
                onChange={(e) => onDocumentNotesChange(doc.id, e.target.value)}
                className="min-h-20 w-full rounded-sm border border-charcoal bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
                placeholder="Add abstract, methods, main findings, or why this source matters."
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
