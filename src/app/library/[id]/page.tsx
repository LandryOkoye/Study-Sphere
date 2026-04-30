"use client";

import { useState, Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { TOCExplorer } from "@/components/ide/TOCExplorer";
import { AIChat } from "@/components/ide/AIChat";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useLibraries, Library } from "@/hooks/useLibraries";
import { MarkdownRenderer } from "@/components/ide/MarkdownRenderer";

function LibraryIDEContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const libraryId = params.id as string;
  const sharedData = searchParams.get("data");

  const { getLibraryById, isLoaded } = useLibraries();
  
  const [library, setLibrary] = useState<Library | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        setLibrary(decoded);
      } catch (e) {
        console.error("Invalid shared data", e);
      }
    } else if (isLoaded) {
      const found = getLibraryById(libraryId);
      if (found) setLibrary(found);
    }
  }, [sharedData, isLoaded, libraryId, getLibraryById]);

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
        body: JSON.stringify({ topicTitle: title, subject: "Physics" }), // Hardcoded subject for now as per original IDE
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

  if (!isLoaded && !sharedData) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground/50">
        Loading Library...
      </div>
    );
  }

  if (!library) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-obsidian font-sans overflow-hidden">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center text-foreground/50">
          <div className="text-center">
            <p className="mb-4">Library not found or invalid link.</p>
            <Link href="/library">
              <Button variant="outline">Back to Libraries</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-obsidian font-sans overflow-hidden">
      <AppHeader />

      {/* 3-Column Resizable Layout */}
      <div className="flex-1 overflow-hidden border-t border-charcoal/30">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel: Explorer */}
          <ResizablePanel id="explorer" defaultSize={20} minSize={15} maxSize={35}>
            <aside className="w-full bg-muted flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-charcoal/30">
                <h2 className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                  {sharedData ? "Shared Library" : "Library View"}
                </h2>
                <p className="font-medium text-sm mt-1 truncate">{library.name}</p>
                <div className="w-5 h-3" />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TOCExplorer 
                  subjectId={library.subjectId} 
                  onSelect={handleTopicSelect} 
                  filterTopicIds={library.topicIds}
                />
              </div>
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-charcoal/50" />

          {/* Center Panel: Main Area */}
          <ResizablePanel id="content" defaultSize={55} minSize={30}>
            <main className="flex flex-col h-full overflow-hidden bg-card relative">
              <div className="h-10 border-b border-charcoal/50 flex items-center px-4 bg-muted/50 text-xs font-mono text-foreground/40 tracking-wider justify-between">
                <span>library / {library.name.toLowerCase().replace(/\s+/g, '-')} / content.md</span>
                <div className="flex items-center gap-3">
                  {latency && (
                    <span className="text-accent-green">
                      ({latency}ms)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:px-16 custom-scrollbar">
                {!topicLoading && !currentContent && !loadError && (
                  <div className="h-full flex flex-col items-center justify-center text-foreground/30">
                    <p className="font-mono text-sm max-w-sm text-center">
                      Select a topic from your library explorer to generate content.
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
                    <p className="text-xs text-foreground/30">There's an issue with the provider. Please try again later.</p>
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
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-charcoal/50" />

          {/* Right Panel: Continuous Chat */}
          <ResizablePanel id="right" defaultSize={25} minSize={20} maxSize={40}>
            <aside className="w-full bg-muted flex flex-col h-full relative z-10 shadow-[0_0_24px_-16px_rgba(0,0,0,0.5)]">
              <AIChat />
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default function LibraryIDEPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground/50">Loading Library IDE Environment...</div>}>
      <LibraryIDEContent />
    </Suspense>
  );
}
