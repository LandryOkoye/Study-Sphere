"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, HardDrive, Network, SearchCheck, Layers } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ide/MarkdownRenderer";
import { useResearchWorkspace } from "@/hooks/useResearchWorkspace";
import { useResearchAgent } from "@/hooks/useResearchAgent";
import type { ResearchAgentContext, ResearchGoal } from "@/lib/research/types";

function ResearchGoalSetup({
  onSubmit,
  isLoading,
}: {
  onSubmit: (goal: ResearchGoal) => Promise<unknown> | void;
  isLoading: boolean;
}) {
  const [goal, setGoal] = useState("");
  const [durationDays, setDurationDays] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    const parsedDuration = Number(durationDays);
    await onSubmit({
      goal: goal.trim(),
      durationDays:
        durationDays.trim() === "" || Number.isNaN(parsedDuration)
          ? undefined
          : parsedDuration,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-sm border border-charcoal/50 bg-muted/40 p-5 flex flex-col gap-5">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue">Research Workflow Agent</div>
        <h1 className="text-2xl font-semibold mt-2">Start a research goal</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Define what you want to understand, compare, or synthesize. The agent will generate a literature map first, then guide the next steps.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-foreground/70">Research goal</span>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="min-h-32 rounded-sm border border-charcoal bg-card px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          placeholder="Example: Compare the main methods and disagreements across these papers on AI in education"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm max-w-xs">
        <span className="text-foreground/70">Duration in days</span>
        <input
          type="number"
          min={1}
          max={90}
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
          className="h-10 rounded-sm border border-charcoal bg-card px-3 focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
          placeholder="Defaults to 14"
        />
      </label>

      <div className="flex items-center justify-between gap-4 border-t border-charcoal/40 pt-4">
        <p className="text-xs font-mono text-foreground/45">Upload documents and add notes in the research workspace before running the agent.</p>
        <Button type="submit" disabled={isLoading || !goal.trim()}>
          {isLoading ? "Initializing..." : "Generate Literature Map"}
        </Button>
      </div>
    </form>
  );
}

function ResearchAgentContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspace");
  const { documents } = useResearchWorkspace(workspaceId);
  const workspaceName = workspaceId ?? "research-workspace";

  const context = useMemo<ResearchAgentContext | null>(() => {
    if (!workspaceId) return null;
    return {
      workspaceId,
      workspaceName,
      documents,
    };
  }, [documents, workspaceId, workspaceName]);

  const agent = useResearchAgent(context);

  async function handleInitialize(goal: ResearchGoal) {
    await agent.initialize(goal);
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-obsidian font-sans">
      <AppHeader />

      <div className="border-b border-charcoal/40 bg-obsidian/80 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={workspaceId ? `/ide?mode=research` : "/hub"}
              className="flex items-center gap-1.5 text-foreground/45 hover:text-foreground transition-colors text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Research Workspace
            </Link>
            <span className="text-charcoal/60 text-xs">/</span>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent-blue" />
              <span className="text-sm font-medium">Research Agent</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-charcoal/30 border border-charcoal/50">
              <HardDrive className="w-3 h-3 text-accent-green" />
              <span className="text-[10px] font-mono text-foreground/60 uppercase tracking-wider">
                {documents.length} docs
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-charcoal/30 border border-charcoal/50">
              <Network className="w-3 h-3 text-accent-green" />
              <span className="text-[10px] font-mono text-foreground/60 uppercase tracking-wider">
                {agent.state.storedArtifacts.length} artifacts on 0G
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6 lg:px-8 lg:py-8">
        {!workspaceId ? (
          <div className="max-w-xl mx-auto rounded-sm border border-charcoal/50 bg-muted/40 p-6 text-center text-foreground/60">
            Open the research workspace first so the agent has a workspace context.
          </div>
        ) : documents.length === 0 ? (
          <div className="max-w-xl mx-auto rounded-sm border border-charcoal/50 bg-muted/40 p-6 text-center">
            <SearchCheck className="w-8 h-8 text-accent-blue mx-auto mb-3" />
            <h1 className="text-xl font-semibold">No research documents yet</h1>
            <p className="text-sm text-foreground/60 mt-2">
              Upload documents in the research workspace and add notes for each file before generating a literature map.
            </p>
            <Link href="/ide?mode=research" className="inline-flex mt-5">
              <Button variant="outline">Go to Research Workspace</Button>
            </Link>
          </div>
        ) : !agent.state.goal ? (
          <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
            <aside className="rounded-sm border border-charcoal/50 bg-muted/40 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-green mb-3">Corpus</div>
              <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-sm border border-charcoal/40 bg-card p-3">
                    <div className="text-sm font-medium">{doc.name}</div>
                    <div className="text-[10px] font-mono text-foreground/45 mt-1">{doc.rootHash.slice(0, 14)}...{doc.rootHash.slice(-8)}</div>
                    <p className="text-xs text-foreground/60 mt-3 whitespace-pre-wrap">
                      {doc.notes.trim() || "No notes added yet."}
                    </p>
                  </div>
                ))}
              </div>
            </aside>

            <main className="min-w-0">
              <ResearchGoalSetup onSubmit={handleInitialize} isLoading={agent.isLoading} />
            </main>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
            <aside className="flex flex-col gap-4">
              <div className="rounded-sm border border-charcoal/50 bg-muted/40 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue mb-2">Research Goal</div>
                <div className="font-semibold">{agent.state.goal.goal}</div>
                <div className="text-xs text-foreground/50 mt-2">
                  {agent.state.goal.durationDays ?? 14} day horizon
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-sm border border-charcoal/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="w-3 h-3 text-foreground/40" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">Docs</span>
                  </div>
                  <div className="text-xl font-semibold">{documents.length}</div>
                </div>
                <div className="rounded-sm border border-charcoal/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3 h-3 text-foreground/40" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">0G</span>
                  </div>
                  <div className="text-xl font-semibold">{agent.state.storedArtifacts.length}</div>
                </div>
              </div>

              <div className="rounded-sm border border-charcoal/50 bg-muted/40 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-green mb-3">Activity Log</div>
                <div className="flex flex-col gap-2">
                  {agent.state.activityLog.slice(-6).reverse().map((entry) => (
                    <div key={entry} className="text-xs text-foreground/60">{entry}</div>
                  ))}
                </div>
              </div>
            </aside>

            <main className="flex flex-col gap-5 min-w-0">
              <div className="rounded-sm border border-charcoal/50 bg-muted/40 p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-blue">Research Workflow Agent</div>
                  <p className="text-sm text-foreground/60 mt-2">
                    The agent can generate a literature map, synthesis note, or reading plan based on your corpus and notes.
                  </p>
                  {agent.decisionSummary && (
                    <div className="mt-3 rounded-sm border border-accent-blue/20 bg-accent-blue/5 px-3 py-2 text-sm">
                      {agent.decisionSummary}
                    </div>
                  )}
                  {agent.error && (
                    <div className="mt-3 rounded-sm border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm text-red-500">
                      {agent.error}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={agent.reset} disabled={agent.isLoading}>Reset</Button>
                  <Button onClick={agent.runNextStep} disabled={agent.isLoading}>
                    {agent.isLoading ? "Running..." : "Run Next Step"}
                  </Button>
                </div>
              </div>

              {agent.state.latestArtifact && (
                <section className="rounded-sm border border-charcoal/50 bg-muted/40 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent-green">
                      Latest {agent.state.latestArtifact.type}
                    </div>
                    {agent.state.latestArtifact.storage && (
                      <div className="text-[10px] font-mono text-foreground/45">
                        0G: {agent.state.latestArtifact.storage.rootHash.slice(0, 14)}...{agent.state.latestArtifact.storage.rootHash.slice(-8)}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 prose prose-invert max-w-none">
                    <MarkdownRenderer content={agent.state.latestArtifact.content} />
                  </div>
                </section>
              )}

              <section className="rounded-sm border border-charcoal/50 bg-muted/40 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-foreground/45 mb-4">Document Corpus</div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-sm border border-charcoal/40 bg-card p-3">
                      <div className="text-sm font-medium">{doc.name}</div>
                      <div className="text-[10px] font-mono text-foreground/45 mt-1">{doc.rootHash}</div>
                      <p className="text-xs text-foreground/60 mt-3 whitespace-pre-wrap">
                        {doc.notes.trim() || "No notes added yet."}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResearchAgentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground/50 font-mono text-sm">Loading Research Agent...</div>}>
      <ResearchAgentContent />
    </Suspense>
  );
}
