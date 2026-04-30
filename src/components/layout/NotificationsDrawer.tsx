"use client";

import { X, Check, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-obsidian/60 z-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-card border-l border-charcoal/80 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-charcoal/50">
          <h2 className="font-medium flex items-center gap-2">
            <Bell className="w-4 h-4 text-foreground/50" /> System Alerts
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-charcoal/50 rounded-sm transition-colors text-foreground/50 hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="bg-charcoal/30 border border-charcoal/50 p-3 rounded-sm space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-accent-green mb-2">
              <Check className="w-3 h-3" />Network Sync Complete
            </div>
            <p className="text-sm text-foreground/80">Your study progress has been permanently logged to the Data Availability layer.</p>
            <p className="text-[10px] text-foreground/40 font-mono mt-2">Just now</p>
          </div>

          <div className="bg-charcoal/30 border border-charcoal/50 p-3 rounded-sm space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-accent-blue mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue"></span> Study Streak Reminder
            </div>
            <p className="text-sm text-foreground/80">You're on a 12-day streak! Complete 1 more topic in Physics to keep it going.</p>
            <p className="text-[10px] text-foreground/40 font-mono mt-2">2 hours ago</p>
          </div>

          <div className="bg-charcoal/30 border border-charcoal/50 p-3 rounded-sm space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground/50 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/50"></span> New Curriculum
            </div>
            <p className="text-sm text-foreground/80">The TOC for "Essential Biology" has been mapped by an admin and is now available.</p>
            <p className="text-[10px] text-foreground/40 font-mono mt-2">1 day ago</p>
          </div>
        </div>
      </div>
    </>
  );
}
