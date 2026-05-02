"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  Layers,
  Activity,
  HardDrive,
  Zap,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { GoalSetup } from "@/components/agent/GoalSetup";
import { AgentDashboard } from "@/components/agent/AgentDashboard";
import { useStudyCoach } from "@/hooks/useStudyCoach";
import { useCurriculum, type TOCNode } from "@/context/CurriculumContext";
import type { StudyAgentContext, StudyAgentGoal } from "@/lib/agent/types";

function flattenTopics(nodes: TOCNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "topic") return [node.title];
    return node.children ? flattenTopics(node.children) : [];
  });
}

function AgentPageContent() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subject");

  const { secondaryTextbooks, universityCourses, tocs } = useCurriculum();
  const allSubjects = [...secondaryTextbooks, ...universityCourses];
  const currentSubjectObj = subjectId
    ? allSubjects.find((s) => s.id === subjectId)
    : null;
  const subjectName = currentSubjectObj ? currentSubjectObj.name : "Curriculum";
  const availableTopics =
    subjectId && tocs[subjectId] ? flattenTopics(tocs[subjectId]) : [];

  const coachContext = useMemo<StudyAgentContext | null>(() => {
    if (!subjectId) return null;
    return { subjectId, subjectName, availableTopics };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, subjectName, availableTopics.join("|")]);

  const coach = useStudyCoach(coachContext);

  async function handleInitializeAgent(goal: StudyAgentGoal) {
    await coach.initialize(goal);
  }

  const completedCount = coach.state.plan.filter(
    (t) => t.status === "completed"
  ).length;
  const totalCount = coach.state.plan.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-obsidian font-sans">
      <AppHeader />

      {/* ── Page chrome ─────────────────────────────────────────────────── */}
      <div className="border-b border-charcoal/40 bg-obsidian/80 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={subjectId ? `/ide?subject=${subjectId}` : "/hub"}
              className="flex items-center gap-1.5 text-foreground/45 hover:text-foreground transition-colors text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to IDE
            </Link>
            <span className="text-charcoal/60 text-xs">/</span>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent-blue" />
              <span className="text-sm font-medium">Study Coach</span>
              {subjectId && (
                <>
                  <span className="text-charcoal/60 text-xs">/</span>
                  <span className="text-sm text-foreground/60">
                    {subjectName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-3">
            {coach.isLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-accent-blue/10 border border-accent-blue/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                <span className="text-[10px] font-mono text-accent-blue uppercase tracking-wider">
                  Processing
                </span>
              </div>
            )}
            {coach.state.goal && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-charcoal/30 border border-charcoal/50">
                <Zap className="w-3 h-3 text-accent-green" />
                <span className="text-[10px] font-mono text-foreground/60 uppercase tracking-wider">
                  {progressPct}% complete
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-charcoal/30 border border-charcoal/50">
              <HardDrive className="w-3 h-3 text-accent-green" />
              <span className="text-[10px] font-mono text-foreground/60 uppercase tracking-wider">
                {coach.state.storedArtifacts.length} artifacts on 0G
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6 lg:px-8 lg:py-8">
        {!coach.state.goal ? (
          /* ── Goal setup ───────────────────────────────────────────────── */
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent-blue/10 border border-accent-blue/20 mb-4">
                <Bot className="w-7 h-7 text-accent-blue" />
              </div>
              <h1 className="text-2xl font-semibold">Study Coach Agent</h1>
              <p className="mt-2 text-foreground/55 text-sm max-w-md mx-auto">
                Set your exam-prep goal once. The agent plans, recommends
                topics, generates lessons and quizzes, and grades answers—all
                powered by 0G Compute.
              </p>
            </div>
            <GoalSetup
              subjectName={subjectName}
              onSubmit={handleInitializeAgent}
              isLoading={coach.isLoading}
            />
          </div>
        ) : (
          /* ── Active agent ─────────────────────────────────────────────── */
          <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] items-start">
            {/* ── LEFT RAIL: Plan overview ───────────────────────────────── */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h,3.5rem)+1px+80px)]">
              {/* Goal card */}
              <div className="rounded-sm border border-charcoal/50 bg-muted/40 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue mb-2">
                  Active Goal
                </div>
                <div className="font-semibold">
                  {coach.state.goal.subject} — {coach.state.goal.examType}
                </div>
                <div className="text-xs text-foreground/50 mt-1">
                  {coach.state.goal.durationDays} days ·{" "}
                  {coach.state.goal.dailyMinutes} min/day · target{" "}
                  {coach.state.goal.targetScore}%
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-foreground/45 mb-1.5">
                    <span>Plan progress</span>
                    <span>
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-charcoal/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-green transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-sm border border-charcoal/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3 h-3 text-foreground/40" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">
                      Weak
                    </span>
                  </div>
                  <div className="text-xl font-semibold">
                    {coach.state.weakTopics.length}
                  </div>
                  <div className="text-[10px] text-foreground/40">topics</div>
                </div>
                <div className="rounded-sm border border-charcoal/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3 h-3 text-foreground/40" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">
                      0G
                    </span>
                  </div>
                  <div className="text-xl font-semibold">
                    {coach.state.storedArtifacts.length}
                  </div>
                  <div className="text-[10px] text-foreground/40">artifacts</div>
                </div>
              </div>

              {/* Plan task list */}
              <div className="rounded-sm border border-charcoal/50 bg-muted/40 p-4 flex flex-col gap-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-green">
                  Study Plan
                </div>
                {coach.state.plan.length === 0 ? (
                  <p className="text-xs text-foreground/40 font-mono">
                    Plan will appear after first step.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                    {coach.state.plan.map((task) => {
                      const isActive = task.id === coach.state.currentTaskId;
                      const isDone = task.status === "completed";
                      return (
                        <div
                          key={task.id}
                          className={`rounded-sm border p-2.5 transition-colors ${
                            isActive
                              ? "border-accent-blue/40 bg-accent-blue/5"
                              : isDone
                              ? "border-charcoal/30 bg-charcoal/10 opacity-60"
                              : "border-charcoal/40 bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-mono text-foreground/40">
                                Day {task.day}
                              </div>
                              <div className="text-xs font-medium mt-0.5 leading-snug truncate">
                                {task.title}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 text-[9px] font-mono uppercase tracking-wider mt-0.5 ${
                                isDone
                                  ? "text-accent-green"
                                  : isActive
                                  ? "text-accent-blue"
                                  : "text-foreground/35"
                              }`}
                            >
                              {isDone
                                ? "done"
                                : isActive
                                ? "active"
                                : "pending"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Activity log (last 5) */}
              {coach.state.activityLog.length > 0 && (
                <div className="rounded-sm border border-charcoal/50 bg-muted/40 p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Activity className="w-3 h-3 text-foreground/40" />
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-foreground/40">
                      Activity Log
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {coach.state.activityLog
                      .slice(-5)
                      .reverse()
                      .map((entry, i) => (
                        <div
                          key={i}
                          className="text-xs text-foreground/55 leading-snug"
                        >
                          {entry}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </aside>

            {/* ── MAIN PANEL: Dashboard ──────────────────────────────────── */}
            <main className="min-w-0">
              <AgentDashboard
                state={coach.state}
                decisionSummary={coach.decisionSummary}
                error={coach.error}
                isLoading={coach.isLoading}
                onRunStep={coach.runNextStep}
                onCompleteTask={coach.completeTask}
                onSubmitQuizResult={coach.submitQuizResult}
                onReset={coach.reset}
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground/50 font-mono text-sm">
          Loading Study Coach...
        </div>
      }
    >
      <AgentPageContent />
    </Suspense>
  );
}
