"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Settings, Bell, Search, Wallet } from "lucide-react";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { SettingsModal } from "./SettingsModal";
import { useWallet, shortenAddress } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { address } = useWallet();

  return (
    <>
      <header className="h-14 border-b border-charcoal bg-obsidian/95 backdrop-blur z-40 sticky top-0 flex items-center justify-between px-6">

        {/* Left section: Branding and Network Status */}
        <div className="flex items-center gap-6">
          <Link href="/hub" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="StudySphere Logo" width={20} height={20} className="group-hover:opacity-80 transition-opacity" priority />
            <span className="font-bold tracking-tight text-sm">StudySphere</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-charcoal/30 border border-charcoal/50 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
            <span className="text-[10px] font-mono text-foreground/70 tracking-wider"> <span className="text-accent-green">12ms latency</span></span>
          </div>
        </div>

        {/* Right section: User Identity & Actions */}
        <div className="flex items-center gap-4">

          {/* Global Search Mock */}
          <button className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-charcoal/50 text-foreground/50 hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-charcoal/50 text-foreground/50 hover:text-foreground transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-blue rounded-full"></span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-charcoal/50 text-foreground/50 hover:text-foreground transition-colors mr-2"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Identity Token / Connect Wallet */}
          {address ? (
            <Link href="/profile">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal/40 border border-charcoal/80 rounded-sm hover:bg-charcoal/80 transition-colors cursor-pointer">
                <div className="w-5 h-5 bg-gradient-to-br from-accent-blue/20 to-accent-green/20 rounded-sm flex items-center justify-center border border-charcoal">
                  <span className="text-[10px] font-mono text-foreground">0x</span>
                </div>
                <span className="font-mono text-xs font-medium tracking-wide">{shortenAddress(address)}</span>
              </div>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="sm" variant="outline" className="flex items-center gap-2 border-charcoal/80 hover:bg-charcoal/80">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </Button>
            </Link>
          )}

        </div>
      </header>

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
