"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Share2, ExternalLink } from "lucide-react";

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  libraryName: string;
};

export function ShareModal({ isOpen, onClose, shareUrl, libraryName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-charcoal/50 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-charcoal/30 flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3 text-accent-blue">
            <Share2 className="w-5 h-5" />
            <h2 className="text-lg font-bold font-sans text-foreground">
              Share Library
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal/50 text-foreground/50 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <p className="text-foreground/70 text-sm mb-4">
              Step into the future of collaborative learning. Anyone with this link can view <span className="text-foreground font-semibold">"{libraryName}"</span> but cannot modify it.
            </p>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ExternalLink className="h-4 w-4 text-foreground/30" />
              </div>
              <input 
                type="text" 
                readOnly 
                value={shareUrl}
                className="block w-full h-12 pl-10 pr-24 bg-charcoal/30 border border-charcoal/50 rounded-xl text-sm text-foreground/80 focus:outline-none focus:border-accent-blue transition-all font-mono"
              />
              <button 
                onClick={handleCopy}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-accent-blue text-obsidian text-xs font-bold uppercase tracking-wider hover:bg-accent-blue/90 transition-all flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-accent-blue/5 border border-accent-blue/10 rounded-xl p-4">
            <p className="text-[11px] text-accent-blue/70 leading-relaxed italic">
              * This link contains a snapshot of your library configuration. If you make major changes, you might want to generate a new link to share the latest version.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-charcoal/30 bg-muted/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-charcoal/40 text-foreground/70 hover:text-foreground hover:bg-charcoal/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
