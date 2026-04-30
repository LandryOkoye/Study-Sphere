"use client";

import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
// TODO import { Button } from "@/components/ui/button";

export function DocumentUpload() {
  const [uploads, setUploads] = useState<{ id: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setUploads(prev => [...prev, { id: Math.random().toString(), name: file.name }]);
        setIsUploading(false);
      }, 1000); // Simulate upload delay
    }
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <aside className="w-full bg-muted flex flex-col h-full overflow-hidden border-l border-charcoal/50">
      <div className="p-4 border-b border-charcoal/30 flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-foreground/50">Environment Documents</h2>
      </div>

      <div className="p-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-charcoal/50 rounded-sm hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-colors cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-6 h-6 text-foreground/40 group-hover:text-accent-blue mb-2" />
            <p className="mb-1 text-sm text-foreground/70"><span className="font-medium">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-foreground/40">PDF, DOCX, TXT (MAX. 10MB)</p>
          </div>
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
        {isUploading && <p className="text-xs text-accent-blue mt-2 font-mono animate-pulse">Uploading...</p>}

        <div className="mt-6 flex flex-col gap-3">
          <h3 className="text-xs font-mono tracking-wider text-foreground/50 mb-2">UPLOADED FILES</h3>
          
          {uploads.length === 0 && (
            <div className="text-center text-sm text-foreground/40 py-8">
              No documents uploaded yet.
            </div>
          )}

          {uploads.map(doc => (
            <div key={doc.id} className="p-3 border border-charcoal bg-obsidian rounded-sm flex items-start justify-between group">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-charcoal/50 rounded-sm">
                  <FileText className="w-4 h-4 text-foreground/70" />
                </div>
                <div>
                  <h4 className="text-sm font-medium line-clamp-1 truncate max-w-[150px]">{doc.name}</h4>
                  <p className="text-xs text-foreground/50 mt-1">Ready for analysis</p>
                </div>
              </div>
              <button 
                onClick={() => removeUpload(doc.id)} 
                className="text-foreground/30 hover:text-red-400 transition-colors mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
