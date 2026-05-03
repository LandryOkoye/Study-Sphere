"use client";

import { useEffect, useState } from "react";
import type {
  ResearchAgentContext,
  ResearchAgentOperation,
  ResearchAgentResponse,
  ResearchAgentState,
  ResearchGoal,
} from "@/lib/research/types";

const EMPTY_STATE: ResearchAgentState = {
  goal: null,
  latestArtifact: null,
  storedArtifacts: [],
  activityLog: [],
  updatedAt: null,
};

function storageKey(workspaceId: string) {
  return `research_agent_state_${workspaceId}`;
}

export function useResearchAgent(context: ResearchAgentContext | null) {
  const [state, setState] = useState<ResearchAgentState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionSummary, setDecisionSummary] = useState<string | null>(null);
  const workspaceId = context?.workspaceId ?? null;

  useEffect(() => {
    if (!workspaceId) {
      setState(EMPTY_STATE);
      setError(null);
      setDecisionSummary(null);
      return;
    }

    const stored = localStorage.getItem(storageKey(workspaceId));
    if (!stored) {
      setState(EMPTY_STATE);
      return;
    }

    try {
      setState(JSON.parse(stored) as ResearchAgentState);
    } catch {
      setState(EMPTY_STATE);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(state));
  }, [workspaceId, state]);

  async function runOperation(operation: ResearchAgentOperation) {
    if (!context) return null;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/research-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, context, operation }),
      });
      const data = (await response.json()) as ResearchAgentResponse | { error?: string };
      if (!response.ok || !("state" in data)) {
        throw new Error(("error" in data && data.error) || `HTTP ${response.status}`);
      }
      setState(data.state);
      setDecisionSummary(data.decisionSummary);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Research agent request failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  function initialize(goal: ResearchGoal) {
    return runOperation({ type: "initialize", goal });
  }

  function runNextStep() {
    return runOperation({ type: "run-step" });
  }

  function reset() {
    setState(EMPTY_STATE);
    setError(null);
    setDecisionSummary(null);
    if (workspaceId) {
      localStorage.removeItem(storageKey(workspaceId));
    }
  }

  return {
    state,
    isLoading,
    error,
    decisionSummary,
    initialize,
    runNextStep,
    reset,
  };
}
