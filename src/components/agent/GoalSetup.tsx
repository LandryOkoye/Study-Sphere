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
  const [goal, setGoal] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("60");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return;

    const parsedDuration = Number(durationDays);
    const parsedDailyMinutes = Number(dailyMinutes);

    await onSubmit({
      goal: trimmedGoal,
      subject: subjectName,
      durationDays:
        durationDays.trim() === "" || Number.isNaN(parsedDuration)
          ? undefined
          : parsedDuration,
      dailyMinutes:
        dailyMinutes.trim() === "" || Number.isNaN(parsedDailyMinutes)
          ? undefined
          : parsedDailyMinutes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-charcoal/50 rounded-sm bg-muted/40 p-5 flex flex-col gap-5">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue">Study Coach Agent</div>
        <h2 className="text-xl font-semibold mt-2">Start a learning goal</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Define the outcome you want. The agent will build a study plan, recommend the next topic, and generate lessons or quizzes through 0G Compute.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Subject</span>
          <input
            value={subjectName}
            disabled
            className="h-10 rounded-sm border border-charcoal bg-charcoal/20 px-3 text-foreground/60"
          />
        </label>

        <label className="md:col-span-2 flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Goal</span>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="min-h-28 rounded-sm border border-charcoal bg-card px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
            placeholder="Example: Understand Newtonian mechanics well enough to solve introductory problems"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Duration in days</span>
          <input
            type="number"
            min={1}
            max={120}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
            placeholder="Defaults to 14"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-foreground/70">Daily study minutes</span>
          <input
            type="number"
            min={15}
            max={300}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(e.target.value)}
            className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
            placeholder="Defaults to 60"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-charcoal/40 pt-4">
        <p className="text-xs font-mono text-foreground/45">If duration is left blank, the initial plan defaults to 14 days.</p>
        <Button type="submit" disabled={isLoading || !goal.trim()}>
          {isLoading ? "Initializing..." : "Start Agent"}
        </Button>
      </div>
    </form>
  );
}
