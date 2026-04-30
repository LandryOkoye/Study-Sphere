"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Filter, Plus, Pencil, Share2, Trash2, FlaskConical, Microscope, Brain, Compass, BookOpen } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useCurriculum } from "@/context/CurriculumContext";
import { useLibraries, Library } from "@/hooks/useLibraries";
import { LibraryModal } from "@/components/library/LibraryModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ShareModal } from "@/components/library/ShareModal";

function LibraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get("subject");
  const { secondaryTextbooks, universityCourses } = useCurriculum();
  const { libraries, isLoaded, addLibrary, updateLibrary, deleteLibrary, getLibrariesBySubject } = useLibraries();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLibraryId, setDeletingLibraryId] = useState<string | null>(null);
  const [deletingLibraryName, setDeletingLibraryName] = useState<string>("");

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingUrl, setSharingUrl] = useState<string>("");
  const [sharingLibraryName, setSharingLibraryName] = useState<string>("");

  const allSubjects = [...secondaryTextbooks, ...universityCourses];
  const currentSubjectObj = subjectId ? allSubjects.find(s => s.id === subjectId) : null;
  const actualSubjectId = subjectId || "sec-phy";

  const subjectLibraries = getLibrariesBySubject(actualSubjectId);

  const handleCreateNew = () => {
    setEditingLibrary(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lib: Library, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingLibrary(lib);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingLibraryId(id);
    setDeletingLibraryName(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingLibraryId) {
      deleteLibrary(deletingLibraryId);
      setDeletingLibraryId(null);
    }
  };

  const handleShare = (lib: Library, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const dataString = btoa(JSON.stringify(lib));
    const url = `${window.location.origin}/library/shared?data=${dataString}`;
    setSharingUrl(url);
    setSharingLibraryName(lib.name);
    setIsShareModalOpen(true);
  };

  const handleSaveLibrary = (name: string, topicIds: string[]) => {
    if (editingLibrary) {
      updateLibrary(editingLibrary.id, { name, topicIds });
    } else {
      addLibrary({
        name,
        subjectId: actualSubjectId,
        topicIds,
      });
    }
  };

  const renderIcon = (type: string) => {
    switch(type) {
      case "flask": return <FlaskConical className="w-5 h-5" />;
      case "microscope": return <Microscope className="w-5 h-5" />;
      case "brain": return <Brain className="w-5 h-5" />;
      case "compass": return <Compass className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const timeAgo = (timestamp: number) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    return rtf.format(daysDifference, 'day');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-obsidian font-sans overflow-hidden">
      <AppHeader />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Background ambient light */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-10 lg:px-12 lg:py-16 relative z-10 w-full">
          
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors mb-8 group"
          >
            <div className="w-8 h-8 rounded-full border border-charcoal/50 flex items-center justify-center bg-charcoal/20 group-hover:bg-charcoal/40 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Back to IDE</span>
          </button>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent-blue mb-3 font-bold">Collections</h2>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">My Study Libraries</h1>
              <p className="text-foreground/70 text-base md:text-lg leading-relaxed max-w-xl">
                Manage your curated research modules and AI-generated study paths.
                Each library acts as a container for your deep-work sessions.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input 
                  type="text" 
                  placeholder="Search libraries..." 
                  className="w-full h-10 pl-9 pr-4 bg-charcoal/30 border border-charcoal/50 rounded-full text-sm focus:outline-none focus:border-charcoal focus:bg-charcoal/50 transition-colors placeholder:text-foreground/30 text-foreground"
                />
              </div>
              <button className="h-10 px-4 bg-charcoal/30 hover:bg-charcoal/50 border border-charcoal/50 rounded-full flex items-center gap-2 text-sm font-medium transition-colors text-foreground whitespace-nowrap">
                <Filter className="w-4 h-4 text-accent-blue" />
                Filter
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* User libraries */}
            {isLoaded && subjectLibraries.map((lib) => (
              <Link href={`/library/${lib.id}?subject=${actualSubjectId}`} key={lib.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal/40 to-muted/20 border border-charcoal/40 hover:border-charcoal transition-all p-6 flex flex-col min-h-[220px]">
                {/* Abstract shape backdrop */}
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-charcoal/50 rounded-full blur-2xl opacity-50 group-hover:bg-accent-blue/10 transition-colors" />
                
                <div className="flex items-start justify-between relative z-10 mb-auto">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center backdrop-blur-sm text-accent-blue">
                    {renderIcon("book")}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEdit(lib, e)} className="w-8 h-8 rounded-full hover:bg-charcoal/50 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleShare(lib, e)} className="w-8 h-8 rounded-full hover:bg-charcoal/50 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleDeleteClick(lib.id, lib.name, e)} className="w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center text-foreground/50 hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative z-10 mt-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 group-hover:text-accent-blue transition-colors line-clamp-1">{lib.name}</h3>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal/40 border border-charcoal text-xs font-medium text-foreground/90">
                      <span className="text-[10px]">❖</span>
                      {lib.topicIds.length} Topics
                    </div>
                    <span className="text-[10px] text-foreground/50 font-medium">
                      {timeAgo(lib.updatedAt)}
                    </span>
                  </div>

                </div>
              </Link>
            ))}

            {/* Create New Library Card */}
            <button onClick={handleCreateNew} className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-charcoal/60 hover:border-accent-blue/50 bg-charcoal/10 hover:bg-accent-blue/5 transition-all p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
              <div className="w-12 h-12 rounded-full bg-charcoal/50 group-hover:bg-accent-blue/20 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-6 h-6 text-foreground/60 group-hover:text-accent-blue transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Create New Library</h3>
              <p className="text-sm text-foreground/50 max-w-[200px]">
                Start a new research project or study module.
              </p>
            </button>

          </div>
        </div>
      </main>

      <LibraryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subjectId={actualSubjectId}
        initialData={editingLibrary}
        onSave={handleSaveLibrary}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Library"
        message={`Are you sure you want to delete "${deletingLibraryName}"? This action cannot be undone.`}
        confirmLabel="Delete Library"
        variant="danger"
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={sharingUrl}
        libraryName={sharingLibraryName}
      />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground/50">Loading Library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
