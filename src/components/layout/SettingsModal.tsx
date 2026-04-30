"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { X, User, Monitor, Database, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWallet, shortenAddress } from "@/context/WalletContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "data">("preferences");
  const { theme, setTheme } = useTheme();
  const { address, walletType, disconnect } = useWallet();

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border border-charcoal/80 rounded-sm shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-charcoal/50">
          <h2 className="font-medium">System Configuration</h2>
          <button onClick={onClose} className="p-1 hover:bg-charcoal/50 rounded-sm transition-colors text-foreground/50 hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-charcoal/50 bg-muted p-4 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab("account")}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-left transition-colors", activeTab === "account" ? "bg-charcoal/60 text-foreground" : "text-foreground/60 hover:text-foreground hover:bg-charcoal/30")}
            >
              <User className="w-4 h-4" /> Account
            </button>
            <button 
              onClick={() => setActiveTab("preferences")}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-left transition-colors", activeTab === "preferences" ? "bg-charcoal/60 text-foreground" : "text-foreground/60 hover:text-foreground hover:bg-charcoal/30")}
            >
              <Monitor className="w-4 h-4" /> Preferences
            </button>
            <button 
              onClick={() => setActiveTab("data")}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-left transition-colors", activeTab === "data" ? "bg-charcoal/60 text-foreground" : "text-foreground/60 hover:text-foreground hover:bg-charcoal/30")}
            >
              <Database className="w-4 h-4" /> Data & 0G
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Wallet Management</h3>
                  {address ? (
                    <div className="p-4 border border-charcoal rounded-sm bg-charcoal/20 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {walletType === "metamask" ? "MetaMask" : walletType === "okx" ? "OKX Wallet" : "Wallet"} (Connected)
                        </p>
                        <p className="text-xs font-mono text-foreground/50 mt-1">
                          {shortenAddress(address)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-charcoal rounded-sm text-sm text-foreground/50">
                      No wallet connected. Go to the auth page to connect.
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-4 border-t border-charcoal/50 pt-6">Email Authentication</h3>
                  <p className="text-sm text-foreground/50 mb-4">Link an email to create a non-custodial wallet fallback.</p>
                  <Button variant="outline" size="sm">Link Email</Button>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Interface Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => handleThemeChange("dark")}
                      className={cn("p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors", theme === "dark" || !theme ? "border-accent-blue bg-accent-blue/5 text-foreground font-medium" : "border-charcoal bg-transparent hover:bg-charcoal/20 text-foreground/50")}
                    >
                      <span className="text-sm">Obsidian (Dark)</span>
                      {theme === "dark" || !theme ? <div className="w-3 h-3 rounded-full bg-accent-blue"></div> : null}
                    </div>
                    <div 
                      onClick={() => handleThemeChange("light")}
                      className={cn("p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors", theme === "light" ? "border-accent-blue bg-accent-blue/5 text-foreground font-medium" : "border-charcoal bg-transparent hover:bg-charcoal/20 text-foreground/50")}
                    >
                      <span className="text-sm">Light Mode</span>
                      {theme === "light" ? <div className="w-3 h-3 rounded-full bg-accent-blue"></div> : null}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4 border-t border-charcoal/50 pt-6">UI Density</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="density" className="accent-accent-blue" defaultChecked />
                      <span className="text-sm">Compact (IDE)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="density" className="accent-accent-blue" disabled />
                      <span className="text-sm text-foreground/50">Loose (Reader)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Decentralized Storage (0G)</h3>
                  <p className="text-sm text-foreground/60 mb-4">View your local cache and synchronized on-chain interactions.</p>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="w-4 h-4" /> Export Local Cache (JSON)
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Database className="w-4 h-4" /> Contract Interactions Explorer
                    </Button>
                  </div>
                </div>
                <div className="pt-6 border-t border-red-500/20">
                  <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
                  <p className="text-xs text-foreground/50 mb-4">Purging local cache will require re-fetching data from the 0G Network nodes.</p>
                  <Button variant="danger" size="sm">Purge Local Cache</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
