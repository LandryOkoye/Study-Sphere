"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  StudyAgentContext,
  StudyAgentGoal,
  StudyAgentOperation,
  StudyAgentResponse,
  StudyAgentState,
} from "@/lib/agent/types";

const EMPTY_STATE: StudyAgentState = {
  goal: null,
  plan: [],
  weakTopics: [],
  lastRecommendedTopic: null,
  currentTaskId: null,
  latestArtifact: null,
  storedArtifacts: [],
  recentQuizResults: [],
  activityLog: [],
  updatedAt: null,
};

function storageKey(subjectId: string) {
  return `study_coach_state_${subjectId}`;
}

export function useStudyCoach(context: StudyAgentContext | null) {
  const [state, setState] = useState<StudyAgentState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionSummary, setDecisionSummary] = useState<string | null>(null);
  const subjectId = context?.subjectId ?? null;
  const contextKey = useMemo(() => {
    if (!context) return null;
    return `${context.subjectId}:${context.subjectName}:${context.availableTopics.join("|")}`;
  }, [context]);

  useEffect(() => {
    if (!subjectId) {
      setState(EMPTY_STATE);
      setDecisionSummary(null);
      setError(null);
      return;
    }

    const stored = localStorage.getItem(storageKey(subjectId));
    if (!stored) {
      setState(EMPTY_STATE);
      return;
    }

    try {
      setState(JSON.parse(stored) as StudyAgentState);
    } catch {
      setState(EMPTY_STATE);
    }
  }, [subjectId, contextKey]);

  useEffect(() => {
    if (!subjectId) return;
    localStorage.setItem(storageKey(subjectId), JSON.stringify(state));
  }, [subjectId, state]);

  async function runOperation(operation: StudyAgentOperation) {
    if (!context) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/study-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          context,
          operation,
        }),
      });

      const data = (await response.json()) as StudyAgentResponse | { error?: string };
      if (!response.ok || !("state" in data)) {
        throw new Error(("error" in data && data.error) || `HTTP ${response.status}`);
      }

      setState(data.state);
      setDecisionSummary(data.decisionSummary);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Agent request failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function initialize(goal: StudyAgentGoal) {
    return runOperation({ type: "initialize", goal });
  }

  async function runNextStep() {
    return runOperation({ type: "run-step" });
  }

  async function completeTask(taskId: string) {
    return runOperation({ type: "complete-task", taskId });
  }

  async function submitQuizResult(
    topic: string,
    answers: Array<{ questionId: string; response: string }>
  ) {
    return runOperation({ type: "submit-quiz-result", topic, answers });
  }

  function reset() {
    setState(EMPTY_STATE);
    setDecisionSummary(null);
    setError(null);
    if (context) {
      localStorage.removeItem(storageKey(context.subjectId));
    }
  }

  return {
    state,
    isLoading,
    error,
    decisionSummary,
    initialize,
    runNextStep,
    completeTask,
    submitQuizResult,
    reset,
  };
}
