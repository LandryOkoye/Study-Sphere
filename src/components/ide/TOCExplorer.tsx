"use client";

import { useState, useMemo } from "react";
import { ChevronRight, File, FolderOpen, CheckCircle2 } from "lucide-react";
//TODO  import { cn } from "@/lib/utils";

import { useCurriculum, TOCNode } from "@/context/CurriculumContext";

export function TOCExplorer({ subjectId, onSelect, filterTopicIds }: { subjectId: string, onSelect: (id: string, title: string) => void, filterTopicIds?: string[] }) {
  const { tocs } = useCurriculum();
  
  const filteredTOC = useMemo(() => {
    const rawTOC = tocs[subjectId] || [];
    if (!filterTopicIds) return rawTOC;
    
    return rawTOC.map(chapter => {
      if (chapter.type !== "chapter" || !chapter.children) return chapter;
      const filteredChildren = chapter.children.filter(t => filterTopicIds.includes(t.id));
      return { ...chapter, children: filteredChildren };
    }).filter(chapter => chapter.children && chapter.children.length > 0);
  }, [tocs, subjectId, filterTopicIds]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "ch1": true });
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (node: TOCNode) => {
    if (node.type === "chapter") {
      toggleExpand(node.id);
    } else {
      setActiveId(node.id);
      onSelect(node.id, node.title);
    }
  };

  const renderNode = (node: TOCNode, depth = 0) => {
    const isExpanded = !!expanded[node.id];
    const isActive = activeId === node.id;
    const isCompleted = node.progress === 100;

    return (
      <div key={node.id} className="flex flex-col">
        <button
          onClick={() => handleSelect(node)}
          className={cn(
            "flex items-center gap-2 py-2 px-4 hover:bg-charcoal/50 text-left transition-colors text-sm group",
            isActive && "bg-charcoal/60 text-accent-green"
          )}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
        >
          {node.type === "chapter" ? (
            <ChevronRight className={cn("w-4 h-4 text-foreground/40 transition-transform", isExpanded && "rotate-90")} />
          ) : (
            <div className="w-4 flex justify-center">
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-blue" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-charcoal group-hover:bg-foreground/30" />
              )}
            </div>
          )}

          <span className={cn(
            "flex-1 truncate",
            node.type === "chapter" ? "font-medium" : "text-foreground/80",
            isActive && "font-medium"
          )}>
            {node.title}
          </span>

        </button>

        {isExpanded && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2">
      {filteredTOC.length === 0 ? (
        <div className="px-4 text-xs text-foreground/50">No topics found for this subject.</div>
      ) : (
        filteredTOC.map((node: TOCNode) => renderNode(node, 0))
      )}
    </div>
  );
}
