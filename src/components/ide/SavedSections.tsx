"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Trash2, FolderOpen } from "lucide-react";

type SavedSection = {
  id: string;
  name: string;
  createdAt: number;
};

export function SavedSections({ activeId, onSelect }: { activeId: string | null, onSelect: (id: string) => void }) {
  const [sections, setSections] = useState<SavedSection[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const loadSections = () => {
      const stored = localStorage.getItem("regular_saved_sections");
      if (stored) {
        setSections(JSON.parse(stored));
      }
    };
    
    loadSections();
    
    // Listen for custom event from IDEPage when a section is auto-created
    window.addEventListener("sections-updated", loadSections);
    return () => window.removeEventListener("sections-updated", loadSections);
  }, []);

  const handleSave = (newSections: SavedSection[]) => {
    setSections(newSections);
    localStorage.setItem("regular_saved_sections", JSON.stringify(newSections));
  };

  const addSection = () => {
    if (!newName.trim()) return;
    const item: SavedSection = {
      id: "sec-" + Date.now(),
      name: newName,
      createdAt: Date.now()
    };
    handleSave([...sections, item]);
    setNewName("");
    setIsAdding(false);
  };

  const removeSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave(sections.filter(s => s.id !== id));
    // Provide a null callback if the active one is deleted
    if (activeId === id) onSelect("");
  };

  return (
    <aside className="w-full bg-muted flex flex-col h-full overflow-hidden border-r border-charcoal/50">
      <div className="p-4 border-b border-charcoal/30 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-foreground/50">Saved Sections</h2>
          <p className="font-medium text-sm mt-1">Research Workspaces</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 hover:bg-charcoal/50 rounded-sm text-foreground/60 hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isAdding && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-charcoal/20 border border-charcoal rounded-sm">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSection()}
              placeholder="Section Name..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-foreground/30"
            />
            <button onClick={addSection} className="text-accent-green hover:text-accent-green/80">
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}

        {sections.length === 0 && !isAdding && (
          <div className="text-center text-sm text-foreground/40 mt-10 px-4">
            No saved sections. Click the + icon to create one.
          </div>
        )}

        <div className="space-y-1">
          {sections.map(section => (
            <div
              key={section.id}
              onClick={() => {
                onSelect(section.id);
              }}
              className={`flex items-center justify-between py-2 px-3 rounded-sm cursor-pointer group transition-colors text-sm ${activeId === section.id ? "bg-charcoal/60 text-accent-green font-medium" : "hover:bg-charcoal/30 text-foreground/80"
                }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderOpen className={`w-4 h-4 ${activeId === section.id ? "text-accent-green" : "text-foreground/40"}`} />
                <span className="truncate">{section.name}</span>
              </div>
              <button
                onClick={(e) => removeSection(section.id, e)}
                className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
