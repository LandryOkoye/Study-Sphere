"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BentoBox, BentoGrid } from "@/components/ui/bento-box";
import { 
  Database, User, Target, BrainCircuit, Calendar, 
  Link as LinkIcon, Edit3, Copy, TrendingUp, CheckCircle2, ChevronRight, LayoutDashboard, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet, shortenAddress } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";

const onChainLogs = [
  { id: 1, action: "Save Progress: Physics (t1-2)", cid: "bafybeig...xta", time: "12 mins ago" },
  { id: 2, action: "Summarize: school_handout.pdf", cid: "bafkredq...2lp", time: "2 hrs ago" },
  { id: 3, action: "Compute Inference: Motion Q2", cid: "0x8fae2...94b", time: "5 hrs ago" },
  { id: 4, action: "Save Progress: Chemistry (t3-1)", cid: "bafybeic...mop", time: "1 day ago" },
  { id: 5, action: "KV Update: Study Streak +1", cid: "0x3abf8...11a", time: "1 day ago" },
];

import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { address, walletType, disconnect, userInfo } = useWallet();
  const [username, setUsername] = useState("USER");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  
  const [prefDepth, setPrefDepth] = useState("Professional");
  const [show0GMetrics, setShow0GMetrics] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("study_username");
      if (savedName) setUsername(savedName);
      
      const historyStr = localStorage.getItem("study_history");
      if (historyStr) {
        setHistoryMap(JSON.parse(historyStr));
      }
    } catch(e) {}
  }, []);

  const handleNameSave = () => {
    if (editNameValue.trim()) {
      setUsername(editNameValue.trim());
      localStorage.setItem("study_username", editNameValue.trim());
    }
    setIsEditingName(false);
  };

  // Generate last 120 days array for Heatmap
  const today = new Date();
  const calendarDays = Array.from({ length: 120 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (119 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans">
      <AppHeader />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
        
        {/* Main Grid: Info + Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          
          {/* Left Column: Identity & Preferences */}
          <div className="md:col-span-1 flex flex-col gap-6">
            
            {/* Identity Card */}
            <BentoBox className="flex flex-col items-center py-8 text-center bg-charcoal border-charcoal/80 relative shadow-xl">
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-amber-700/80 rounded-full flex items-center justify-center text-white overflow-hidden shadow-inner">
                  <User className="w-10 h-10 opacity-70" />
                </div>
                <button 
                  onClick={() => {
                    setEditNameValue(username);
                    setIsEditingName(true);
                  }}
                  className="absolute bottom-0 right-0 p-1.5 bg-accent-blue text-background rounded-full hover:bg-accent-blue/80 transition-colors cursor-pointer ring-4 ring-obsidian"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2 w-full px-4">
                  <input 
                    autoFocus
                    className="bg-charcoal border border-charcoal/50 text-foreground text-center rounded-sm px-2 py-1 text-base font-medium w-full"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    onBlur={handleNameSave}
                  />
                </div>
              ) : (
                <h2 className="text-xl font-semibold tracking-tight mb-2">{username}</h2>
              )}
              
              {userInfo?.email && (
                <div className="text-sm text-foreground/70 mb-3 px-3 py-1 bg-black/20 rounded-full border border-charcoal">
                  {userInfo.email}
                </div>
              )}
              
              <div className="text-sm text-foreground/50 font-mono mb-1 tracking-wide">
                {address ? shortenAddress(address) : "Not Connected"}
              </div>
              
              {address && (
                <div className="text-xs text-foreground/40 uppercase tracking-widest mt-1 mb-6">
                  {walletType} WALLET
                </div>
              )}
              
              <div className="w-full flex flex-col gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full gap-2 bg-obsidian border-charcoal/80 hover:bg-charcoal/60 hover:border-accent-blue/50 transition-all shadow-sm"
                  onClick={() => {
                    if(address) navigator.clipboard.writeText(address);
                  }}
                  disabled={!address}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Address
                </Button>
                
                {address && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full gap-2 bg-red-950/20 border-red-900/50 hover:bg-red-900/40 text-red-500 hover:text-red-400 transition-all shadow-sm"
                    onClick={() => {
                      disconnect();
                      router.push("/");
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Disconnect Wallet
                  </Button>
                )}
              </div>
            </BentoBox>

            {/* Learning Preferences */}
            <BentoBox className="bg-charcoal border-charcoal/80 p-5 shadow-lg">
              <h3 className="flex items-center gap-2 font-medium mb-4 text-[15px]">
                <LayoutDashboard className="w-4 h-4 text-accent-blue" /> Learning Preferences
              </h3>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">AI Explanation Depth</div>
                <span className="bg-charcoal/50 text-[10px] px-2 py-0.5 rounded-full text-foreground/70">Advanced</span>
              </div>
              <p className="text-xs text-foreground/50 mb-5">Tailor AI response complexity</p>
              
              <div className="flex flex-col gap-2">
                <label 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors",
                    prefDepth === "Professional" ? "border-accent-blue/50 bg-accent-blue/5" : "border-charcoal/30 bg-transparent hover:bg-charcoal/20"
                  )}
                  onClick={() => setPrefDepth("Professional")}
                >
                  <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", prefDepth === "Professional" ? "border-accent-blue" : "border-foreground/30")}>
                    {prefDepth === "Professional" && <div className="w-2 h-2 rounded-full bg-accent-blue" />}
                  </div>
                  <span className="text-sm">Research Professional</span>
                </label>
                
                <label 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors",
                    prefDepth === "Standard" ? "border-accent-blue/50 bg-accent-blue/5" : "border-charcoal/30 bg-transparent hover:bg-charcoal/20"
                  )}
                  onClick={() => setPrefDepth("Standard")}
                >
                  <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", prefDepth === "Standard" ? "border-accent-blue" : "border-foreground/30")}>
                    {prefDepth === "Standard" && <div className="w-2 h-2 rounded-full bg-accent-blue" />}
                  </div>
                  <span className="text-sm">Standard Academic</span>
                </label>
              </div>
            </BentoBox>

          </div>

          {/* Right Column: Intellectual Growth */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <div className="mb-2">
              <h1 className="text-3xl font-semibold tracking-tight mb-1">Intellectual Growth</h1>
              <p className="text-foreground/50 text-sm">Your academic trajectory for the past 30 days.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: Learning Progress */}
              <BentoBox className="md:col-span-2 bg-charcoal border-charcoal/80 flex flex-col justify-between min-h-[220px] shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-mono uppercase text-foreground/50 mb-4 tracking-wider">Weekly Learning Progress</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-semibold">24.5</span>
                      <span className="text-sm text-foreground/50">Hours</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-charcoal/40 border border-charcoal px-2 py-1 rounded-sm text-xs font-mono text-accent-blue">
                    <TrendingUp className="w-3 h-3" /> 12%
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex justify-between px-2 text-[10px] text-foreground/30 font-mono tracking-wider">
                  <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                </div>
              </BentoBox>

              {/* Box 2: Topics Mastered */}
              <BentoBox className="bg-accent-blue text-obsidian border-transparent flex flex-col justify-between min-h-[220px]">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 opacity-80" />
                </div>
                <div>
                  <div className="text-6xl font-bold tracking-tighter mb-2">42</div>
                  <p className="text-sm font-medium opacity-80 max-w-[150px]">Topics Mastered this semester</p>
                </div>
              </BentoBox>

              {/* Box 3: Current Courses */}
              <BentoBox className="bg-charcoal border-charcoal/80 flex flex-col p-6 min-h-[160px] shadow-lg">
                <h3 className="text-xs font-mono uppercase text-foreground/50 mb-6 tracking-wider">Current Courses</h3>
                <ul className="space-y-4 text-sm font-medium">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30"></span> Quantum Mechanics
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30"></span> Neurobiology II
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30"></span> Advanced Ethics
                  </li>
                </ul>
              </BentoBox>

              {/* Box 4: Deep Work Consistency */}
              <BentoBox className="md:col-span-2 bg-charcoal border-charcoal/80 flex items-center gap-6 p-6 min-h-[160px] shadow-lg">
                <div className="relative w-24 h-24 shrink-0 rounded-full border-4 border-charcoal/50 border-r-accent-blue border-t-accent-blue flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">75%</span>
                  <span className="text-[10px] text-foreground/50 font-mono tracking-wider">FOCUS</span>
                </div>
                <div className="flex flex-col gap-3 justify-center">
                  <h3 className="font-semibold text-lg hover:text-accent-blue transition-colors cursor-pointer flex items-center gap-1">
                    Deep Work Consistency
                  </h3>
                  <p className="text-sm text-foreground/60 leading-relaxed max-w-sm">
                    Your focus sessions are 15% more consistent than last week. Morning study blocks yield the highest retention rates for your profile.
                  </p>
                  <div className="flex items-center gap-1 text-xs text-accent-blue font-medium mt-1 cursor-pointer hover:underline w-fit">
                    View detailed analysis <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </BentoBox>
            </div>
            
          </div>
        </div>

        {/* --- BOTTOM SECTION: HEATMAP & 0G METRICS --- */}
        <div className="mt-8 border-t border-charcoal/30 pt-10 flex flex-col gap-6">
          
          <BentoBox className="w-full bg-charcoal border-charcoal/80 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-blue" /> Daily Consistency Graph
              </h3>
              <div className="text-xs font-mono text-foreground/50 bg-charcoal/30 px-3 py-1 rounded-sm">
                Requires 20 mins active session to map
              </div>
            </div>
            
            <div className="w-full overflow-x-auto hide-scrollbar pb-2">
              <div className="min-w-max flex gap-1.5 flex-wrap h-[140px] flex-col content-start pt-1">
                {calendarDays.map((dateStr, i) => {
                  const isActive = historyMap[dateStr] === true;
                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer",
                        isActive 
                          ? "bg-accent-green shadow-[0_0_8px_rgba(52,211,153,0.4)]" 
                          : "bg-obsidian/60 hover:bg-obsidian"
                      )}
                      title={`${dateStr}: ${isActive ? '20+ Minutes Logged' : 'No significant session'}`}
                    />
                  );
                })}
              </div>
            </div>
          </BentoBox>

          <Button 
            onClick={() => setShow0GMetrics(!show0GMetrics)}
            variant="outline" 
            className="w-full sm:w-auto self-center bg-transparent border-charcoal/50 hover:bg-charcoal/20 gap-2 font-mono text-xs"
          >
            <Database className="w-3.5 h-3.5" />
            {show0GMetrics ? "Hide 0G Network Metrics" : "View 0G Network Metrics"}
          </Button>

          {/* Collapsible 0G Metrics Section */}
          {show0GMetrics && (
            <div className="grid md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <BentoBox className="flex flex-col justify-center border-dashed border-charcoal bg-transparent">
                  <div className="text-foreground/50 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Global Accuracy
                  </div>
                  <div className="text-4xl font-light">84<span className="text-xl text-foreground/40">%</span></div>
                  <div className="text-xs text-accent-green mt-2 font-mono">+2% from last week</div>
                </BentoBox>
                <BentoBox className="flex flex-col justify-center border-dashed border-charcoal bg-transparent">
                  <div className="text-foreground/50 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> Inferences Run
                  </div>
                  <div className="text-4xl font-light">1,204</div>
                  <div className="text-xs text-foreground/50 mt-2 font-mono">Via 0G Compute Nodes</div>
                </BentoBox>
                <BentoBox className="flex flex-col justify-center border-dashed border-charcoal bg-transparent">
                  <div className="text-foreground/50 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Active Streak
                  </div>
                  <div className="text-4xl font-light">12<span className="text-xl text-foreground/40">d</span></div>
                  <div className="text-xs text-foreground/50 mt-2 font-mono">Secured on-chain</div>
                </BentoBox>
              </div>

              <BentoBox className="md:col-span-1 border border-charcoal/80 bg-charcoal flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-foreground/50" /> 0G On-Chain Sync Log
                  </h3>
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                  {onChainLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-charcoal/30 border border-charcoal/50 rounded-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-foreground/80">{log.action}</span>
                        <span className="text-[10px] text-foreground/40 font-mono">{log.time}</span>
                      </div>
                      <div className="text-[10px] font-mono text-accent-blue/80 flex items-center gap-1 bg-black/20 px-2 py-1 rounded w-fit mt-2 border border-accent-blue/10">
                        <LinkIcon className="w-3 h-3" />
                        {log.cid}
                      </div>
                    </div>
                  ))}
                </div>
              </BentoBox>
            </div>
          )}
          
        </div>

      </main>
    </div>
  );
}
