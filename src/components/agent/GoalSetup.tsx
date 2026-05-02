"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { StudyAgentGoal } from "@/lib/agent/types";

type GoalSetupProps = {
  subjectName: string;
  onSubmit: (goal: StudyAgentGoal) => Promise<unknown> | void;
  isLoading: boolean;
};

export function GoalSetup({ subjectName, onSubmit, isLoading }: GoalSetupProps) {
  const [examType, setExamType] = useState("WAEC");
  const [durationDays, setDurationDays] = useState(30);
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [confidenceLevel, setConfidenceLevel] = useState<"low" | "medium" | "high">("medium");
  const [targetScore, setTargetScore] = useState(75);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      examType,
      subject: subjectName,
      durationDays,
      dailyMinutes,
      confidenceLevel,
      targetScore,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-charcoal/50 rounded-sm bg-muted/40 p-5 flex flex-col gap-5">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue">Study Coach Agent</div>
        <h2 className="text-xl font-semibold mt-2">Start an exam-prep goal</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Set the target once. The agent will plan, recommend the next topic, and generate lessons or quizzes through 0G Compute.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Exam type</span>
          <input
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Subject</span>
          <input
            value={subjectName}
            disabled
            className="h-10 rounded-sm border border-charcoal bg-charcoal/20 px-3 text-foreground/60"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Duration in days</span>
          <input
            type="number"
            min={7}
            max={120}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Daily study minutes</span>
          <input
            type="number"
            min={15}
            max={300}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Confidence level</span>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(e.target.value as "low" | "medium" | "high")}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Target score</span>
          <input
            type="number"
            min={50}
            max={100}
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-charcoal/40 pt-4">
        <p className="text-xs font-mono text-foreground/45">The initial plan will be generated on the first 0G Compute run.</p>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Initializing..." : "Start Agent"}
        </Button>
      </div>
    </form>
  );
}
