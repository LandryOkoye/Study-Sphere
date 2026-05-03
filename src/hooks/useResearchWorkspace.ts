"use client";

import { useEffect, useState } from "react";
import type { ResearchWorkspaceDocument } from "@/lib/research/types";

function storageKey(workspaceId: string) {
  return `research_workspace_docs_${workspaceId}`;
}

export function useResearchWorkspace(workspaceId: string | null) {
  const [documents, setDocuments] = useState<ResearchWorkspaceDocument[]>([]);

  useEffect(() => {
    if (!workspaceId) {
      setDocuments([]);
      return;
    }

    const stored = localStorage.getItem(storageKey(workspaceId));
    if (!stored) {
      setDocuments([]);
      return;
    }

    try {
      setDocuments(JSON.parse(stored) as ResearchWorkspaceDocument[]);
    } catch {
      setDocuments([]);
    }
  }, [workspaceId]);

  function persist(nextDocs: ResearchWorkspaceDocument[]) {
    setDocuments(nextDocs);
    if (!workspaceId) return;
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(nextDocs));
  }

  function addDocument(doc: ResearchWorkspaceDocument) {
    persist([...documents, doc]);
  }

  function removeDocument(id: string) {
    persist(documents.filter((doc) => doc.id !== id));
  }

  function updateNotes(id: string, notes: string) {
    persist(documents.map((doc) => (doc.id === id ? { ...doc, notes } : doc)));
  }

  return {
    documents,
    addDocument,
    removeDocument,
    updateNotes,
  };
}
