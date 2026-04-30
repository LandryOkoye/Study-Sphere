"use client";

import { X, AlertTriangle } from "lucide-react";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
};

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel",
  variant = "danger" 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-charcoal/50 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-charcoal/30 flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            {variant === "danger" && <AlertTriangle className="w-5 h-5 text-destructive" />}
            <h2 className="text-lg font-bold font-sans text-foreground">
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-charcoal/50 text-foreground/50 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-foreground/70 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 border-t border-charcoal/30 bg-muted/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-charcoal/50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
              variant === "danger" 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                : "bg-accent-blue text-obsidian hover:bg-accent-blue/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
