"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { TOCExplorer } from "@/components/ide/TOCExplorer";
import { AIChat } from "@/components/ide/AIChat";
import { DocumentUpload } from "@/components/ide/DocumentUpload";
import { SavedSections } from "@/components/ide/SavedSections";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useCurriculum } from "@/context/CurriculumContext";
import { MarkdownRenderer } from "@/components/ide/MarkdownRenderer";

function IDEContent() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subject");
  const mode = searchParams.get("mode");

  const [topicLoading, setTopicLoading] = useState(false);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // For Regular Users (mode = research)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const handleAutoCreateSection = async (msg: string): Promise<string> => {
    const newId = "sec-" + Date.now();
    const newName = msg.slice(0, 25) + (msg.length > 25 ? "..." : "");
    const newSection = { id: newId, name: newName, createdAt: Date.now() };

    const existingStr = localStorage.getItem("regular_saved_sections");
    const existing = existingStr ? JSON.parse(existingStr) : [];
    existing.push(newSection);

    localStorage.setItem("regular_saved_sections", JSON.stringify(existing));

    setActiveSectionId(newId);
    window.dispatchEvent(new Event("sections-updated"));

    return newId;
  };

  const { secondaryTextbooks, universityCourses } = useCurriculum();

  const allSubjects = [...secondaryTextbooks, ...universityCourses];
  const currentSubjectObj = subjectId ? allSubjects.find(s => s.id === subjectId) : null;
  const subjectName = currentSubjectObj ? currentSubjectObj.name : "Curriculum";

  const isRegularMode = mode === "research" || !subjectId;

  const handleTopicSelect = async (topicId: string, title: string) => {
    setTopicLoading(true);
    setCurrentContent(null);
    setLoadError(null);
    setLatency(null);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/0g/chat/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle: title, subject: "Physics" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setCurrentContent(data.content);
      setLatency(Date.now() - startTime);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to generate content";
      setLoadError(errMsg);
    } finally {
      setTopicLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-obsidian font-sans overflow-hidden">
      <AppHeader />

      {/* 3-Column Resizable Layout */}
      <div className="flex-1 overflow-hidden border-t border-charcoal/30">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Explorer */}
          <ResizablePanel id="explorer" defaultSize={20} minSize={15} maxSize={35}>
            {isRegularMode ? (
              <SavedSections activeId={activeSectionId} onSelect={(id) => setActiveSectionId(id || null)} />
            ) : (
              <aside className="w-full bg-muted flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-charcoal/30">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-foreground/50">Curriculum Explorer</h2>
                  <p className="font-medium text-sm mt-1">{subjectName}</p>
                  <div className="w-5 h-3" />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <TOCExplorer subjectId={subjectId!} onSelect={handleTopicSelect} />
                </div>
              </aside>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-charcoal/50" />

          {/* Center Panel: Main Area */}
          <ResizablePanel id="content" defaultSize={55} minSize={30}>
            {isRegularMode ? (
              <main className="flex flex-col h-full overflow-hidden bg-card relative">
                <div className="h-10 border-b border-charcoal/50 flex items-center px-4 bg-muted/50 text-xs font-mono text-foreground/40 tracking-wider justify-between">
                  <span>workspace / {activeSectionId || "new-session"} / chat</span>
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <AIChat
                    hideUpload
                    sectionId={activeSectionId}
                    onAutoCreateSection={handleAutoCreateSection}
                  />
                </div>
              </main>
            ) : (
              <main className="flex flex-col h-full overflow-hidden bg-card relative">
                <div className="h-10 border-b border-charcoal/50 flex items-center px-4 bg-muted/50 text-xs font-mono text-foreground/40 tracking-wider justify-between">
                  <span>root / {subjectName.toLowerCase()} / content.md</span>
                  <div className="flex items-center gap-3">
                    {latency && (
                      <span className="text-accent-green">
                        ({latency}ms)
                      </span>
                    )}
                    <Link href={`/library?subject=${subjectId}`}>
                      <Button size="sm" variant="outline" className="h-8 w-30 text-[10px] bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border-accent-blue/20 py-0 px-2 rounded-sm font-sans uppercase tracking-wider">
                        Library
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:px-16 custom-scrollbar">
                  {!topicLoading && !currentContent && !loadError && (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/30">
                      <p className="font-mono text-sm max-w-sm text-center">
                        Select a topic from the curriculum explorer to generate content.
                      </p>
                    </div>
                  )}

                  {topicLoading && (
                    <div className="h-full py-20 flex items-center justify-center">
                      <SkeletonLoader message="Generating content...." className="max-w-lg bg-transparent border-0" />
                    </div>
                  )}

                  {loadError && (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/50 gap-4">
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm max-w-md text-center">
                        <p className="text-sm text-red-400 mb-2">Failed to generate content</p>
                        <p className="text-xs font-mono text-red-400/70">{loadError}</p>
                      </div>
                      {/* <p className="text-xs text-foreground/30">Make sure your 0G account is funded and the provider is set up via the Admin panel.</p> */}
                      <p className="text-xs text-foreground/30">There's an issue with the provider. Please try again later.</p>
                      console.log(loadError);

                    </div>
                  )}

                  {currentContent && (
                    <article className="max-w-3xl pb-20">
                      <MarkdownRenderer content={currentContent} />

                      <div className="mt-12 flex items-center justify-between border-t border-charcoal/50 pt-6">
                        <Button variant="outline" size="sm">Request Simplification</Button>
                        <Button size="sm">Mark as Understood</Button>
                      </div>
                    </article>
                  )}
                </div>
              </main>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-charcoal/50" />

          {/* Right Panel: Continuous Chat & Docs */}
          <ResizablePanel id="right" defaultSize={25} minSize={20} maxSize={40}>
            {isRegularMode ? (
              <DocumentUpload />
            ) : (
              <aside className="w-full bg-muted flex flex-col h-full relative z-10 shadow-[0_0_24px_-16px_rgba(0,0,0,0.5)]">
                <AIChat />
              </aside>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default function IDEPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground/50">Loading IDE Environment...</div>}>
      <IDEContent />
    </Suspense>
  );
}
