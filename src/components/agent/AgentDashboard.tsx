"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ide/MarkdownRenderer";
import type { StudyAgentState, StudyQuiz } from "@/lib/agent/types";

type AgentDashboardProps = {
  state: StudyAgentState;
  decisionSummary: string | null;
  error: string | null;
  isLoading: boolean;
  onRunStep: () => Promise<unknown> | void;
  onCompleteTask: (taskId: string) => Promise<unknown> | void;
  onSubmitQuizResult: (
    topic: string,
    answers: Array<{ questionId: string; response: string }>
  ) => Promise<unknown> | void;
  onReset: () => void;
};

function parseQuiz(state: StudyAgentState): StudyQuiz | null {
  if (!state.latestArtifact || state.latestArtifact.type !== "quiz") return null;
  try {
    return JSON.parse(state.latestArtifact.content) as StudyQuiz;
  } catch {
    return null;
  }
}

export function AgentDashboard({
  state,
  decisionSummary,
  error,
  isLoading,
  onRunStep,
  onCompleteTask,
  onSubmitQuizResult,
  onReset,
}: AgentDashboardProps) {
  const currentTask = state.plan.find((task) => task.id === state.currentTaskId) ?? null;
  const completedCount = state.plan.filter((task) => task.status === "completed").length;
  const quiz = useMemo(() => parseQuiz(state), [state]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!quiz) {
      setAnswers({});
      return;
    }

    setAnswers(
      quiz.questions.reduce<Record<string, string>>((acc, question) => {
        acc[question.id] = "";
        return acc;
      }, {})
    );
  }, [quiz]);

  const latestScore = state.recentQuizResults[state.recentQuizResults.length - 1] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-charcoal/50 rounded-sm bg-muted/40 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue">Agent Goal</div>
              <h2 className="text-xl font-semibold mt-2">{state.goal?.subject} {state.goal?.examType} Prep</h2>
              <p className="text-sm text-foreground/60 mt-1">
                {state.goal?.durationDays} days, {state.goal?.dailyMinutes} minutes per day, target {state.goal?.targetScore}%.
              </p>
            </div>
            <Button variant="outline" onClick={onReset} disabled={isLoading}>Reset</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-sm border border-charcoal/40 bg-card p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/45">Plan Progress</div>
              <div className="text-2xl font-semibold mt-2">{completedCount}/{state.plan.length}</div>
            </div>
            <div className="rounded-sm border border-charcoal/40 bg-card p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/45">Current Topic</div>
              <div className="text-base font-medium mt-2">{currentTask?.topic ?? state.lastRecommendedTopic ?? "Pending"}</div>
            </div>
            <div className="rounded-sm border border-charcoal/40 bg-card p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/45">Weak Topics</div>
              <div className="text-base font-medium mt-2">{state.weakTopics.length || 0}</div>
            </div>
            <div className="rounded-sm border border-charcoal/40 bg-card p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/45">0G Artifacts</div>
              <div className="text-base font-medium mt-2">{state.storedArtifacts.length}</div>
            </div>
          </div>

          {decisionSummary && (
            <div className="rounded-sm border border-accent-blue/20 bg-accent-blue/5 px-3 py-2 text-sm">
              {decisionSummary}
            </div>
          )}

          {error && (
            <div className="rounded-sm border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          {latestScore && (
            <div className="rounded-sm border border-charcoal/40 bg-card px-3 py-2 text-sm text-foreground/70">
              Latest quiz result: <span className="font-medium text-foreground">{latestScore.score}%</span> on {latestScore.topic}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={onRunStep} disabled={isLoading}>
              {isLoading ? "Running..." : "Run Next Step"}
            </Button>
            {currentTask && (
              <Button variant="outline" onClick={() => onCompleteTask(currentTask.id)} disabled={isLoading}>
                Mark Current Task Complete
              </Button>
            )}
          </div>
        </div>

        <div className="border border-charcoal/50 rounded-sm bg-muted/40 p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-green">Active Plan</div>
          <div className="mt-4 flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {state.plan.map((task) => (
              <div key={task.id} className="rounded-sm border border-charcoal/40 bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/45">Day {task.day}</div>
                    <div className="font-medium mt-1">{task.title}</div>
                    <p className="text-sm text-foreground/60 mt-1">{task.objective}</p>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/45">{task.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {quiz && (
        <section className="border border-charcoal/50 rounded-sm bg-muted/40 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-green">Generated Quiz</div>
              <h3 className="text-lg font-semibold mt-2">{quiz.topic}</h3>
              <p className="text-sm text-foreground/60 mt-1">Submit the student&apos;s answers. The backend grades it through 0G Compute.</p>
            </div>
            <Button
              variant="outline"
              disabled={isLoading || quiz.questions.some((question) => !answers[question.id]?.trim())}
              onClick={() =>
                onSubmitQuizResult(
                  quiz.topic,
                  quiz.questions.map((question) => ({
                    questionId: question.id,
                    response: answers[question.id] ?? "",
                  }))
                )
              }
            >
              {isLoading ? "Grading..." : "Grade Answers"}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {quiz.questions.map((question) => (
              <div key={question.id} className="rounded-sm border border-charcoal/40 bg-card p-3">
                <div className="text-sm font-medium">{question.prompt}</div>
                <textarea
                  value={answers[question.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                  className="mt-3 min-h-28 w-full rounded-sm border border-charcoal bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-green/40"
                  placeholder="Student answer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {state.latestArtifact && state.latestArtifact.type !== "quiz" && (
        <section className="border border-charcoal/50 rounded-sm bg-muted/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue">
              Latest {state.latestArtifact.type}
            </div>
            {state.latestArtifact.storage && (
              <div className="text-[10px] font-mono text-foreground/45">
                0G: {state.latestArtifact.storage.rootHash.slice(0, 14)}...{state.latestArtifact.storage.rootHash.slice(-8)}
              </div>
            )}
          </div>
          <div className="mt-4">
            {state.latestArtifact.type === "plan" ? (
              <div className="text-sm text-foreground/60">
                Initial plan generated and persisted to 0G Storage. Use the active plan panel to track the schedule and run the next step.
              </div>
            ) : (
              <MarkdownRenderer content={state.latestArtifact.content} />
            )}
          </div>
        </section>
      )}

      <section className="border border-charcoal/50 rounded-sm bg-muted/40 p-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-foreground/45">Stored Artifacts</div>
        <div className="mt-4 grid gap-2">
          {state.storedArtifacts.slice(-6).reverse().map((artifact) => (
            <div key={artifact.rootHash} className="rounded-sm border border-charcoal/40 bg-card px-3 py-2 text-sm text-foreground/65">
              {artifact.fileName}
              <div className="text-[10px] font-mono text-foreground/45 mt-1">{artifact.rootHash}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-charcoal/50 rounded-sm bg-muted/40 p-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-foreground/45">Activity Log</div>
        <div className="mt-4 flex flex-col gap-2">
          {state.activityLog.slice(-6).reverse().map((entry) => (
            <div key={entry} className="text-sm text-foreground/60">{entry}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
