"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useCurriculum, TOCNode } from "@/context/CurriculumContext";

type LibraryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  initialData?: { id: string; name: string; topicIds: string[] } | null;
  onSave: (name: string, topicIds: string[]) => void;
};

export function LibraryModal({ isOpen, onClose, subjectId, initialData, onSave }: LibraryModalProps) {
  const [name, setName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { tocs } = useCurriculum();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSelectedTopics(new Set(initialData.topicIds));
      } else {
        setName("");
        setSelectedTopics(new Set());
      }
      setSearchQuery("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const currentTOC = tocs[subjectId] || [];

  const handleToggleTopic = (topicId: string) => {
    const next = new Set(selectedTopics);
    if (next.has(topicId)) {
      next.delete(topicId);
    } else {
      next.add(topicId);
    }
    setSelectedTopics(next);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, Array.from(selectedTopics));
    onClose();
  };

  const flattenTOC = (nodes: TOCNode[]): { chapter: string; topic: TOCNode }[] => {
    let result: { chapter: string; topic: TOCNode }[] = [];
    nodes.forEach(node => {
      if (node.type === "chapter" && node.children) {
        node.children.forEach(child => {
          if (child.type === "topic") {
            result.push({ chapter: node.title, topic: child });
          }
        });
      }
    });
    return result;
  };

  const allTopics = flattenTOC(currentTOC);
  const filteredTopics = allTopics.filter(t => 
    t.topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-charcoal/50 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-charcoal/30 flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-bold font-sans text-foreground">
            {initialData ? "Edit Library" : "Create New Library"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal/50 text-foreground/50 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Library Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Exam Prep, Thesis Research..." 
              autoFocus
              className="w-full h-12 px-4 bg-charcoal/30 border border-charcoal/50 rounded-xl text-foreground focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all font-sans"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground/70">Select Topics</label>
              <span className="text-xs text-accent-blue font-medium bg-accent-blue/10 px-2 py-0.5 rounded-full">
                {selectedTopics.size} selected
              </span>
            </div>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..." 
                className="w-full h-10 pl-9 pr-4 bg-charcoal/30 border border-charcoal/50 rounded-lg text-sm focus:outline-none focus:border-charcoal focus:bg-charcoal/50 transition-colors placeholder:text-foreground/30 text-foreground"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border border-charcoal/30 rounded-xl p-2 bg-obsidian/50 space-y-1">
              {filteredTopics.length === 0 ? (
                <div className="p-8 text-center text-foreground/40 text-sm">
                  No topics found matching your search.
                </div>
              ) : (
                filteredTopics.map((item) => (
                  <label key={item.topic.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-charcoal/40 cursor-pointer transition-colors group">
                    <div className="pt-0.5">
                      <input 
                        type="checkbox" 
                        checked={selectedTopics.has(item.topic.id)}
                        onChange={() => handleToggleTopic(item.topic.id)}
                        className="w-4 h-4 rounded border-charcoal/50 text-accent-blue focus:ring-accent-blue focus:ring-offset-obsidian bg-obsidian"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-accent-blue transition-colors">
                        {item.topic.title}
                      </div>
                      <div className="text-xs text-foreground/50 mt-0.5">
                        {item.chapter}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-charcoal/30 bg-muted/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-charcoal/50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!name.trim() || selectedTopics.size === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent-blue text-obsidian hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]"
          >
            {initialData ? "Save Changes" : "Create Library"}
          </button>
        </div>
      </div>
    </div>
  );
}
