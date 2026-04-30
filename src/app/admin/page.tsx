"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BentoBox } from "@/components/ui/bento-box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Server, Users, BookPlus, Activity, HardDrive, Cpu, DollarSign,
  RefreshCw, AlertCircle, CheckCircle2, Loader2, Wallet, ArrowDownToLine,
  ArrowUpFromLine, ShieldCheck, ArrowLeftRight, Trash2, Plus
} from "lucide-react";
import { useCurriculum, LearningItem, TOCNode } from "@/context/CurriculumContext";

type Tab = "metrics" | "resources" | "content";

type AccountData = {
  providerAddress: string;
  walletBalance: string | null;
  walletError: string | null;
  mainAccount: {
    address: string;
    totalBalance: string;
    availableBalance: string;
  } | null;
  mainAccountError: string | null;
  subAccount: {
    user: string;
    provider: string;
    balance: string;
    pendingRefunds: Array<Record<string, unknown>>;
  } | null;
  subAccountError: string | null;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Form states
  const [depositAmount, setDepositAmount] = useState("10");
  const [transferAmount, setTransferAmount] = useState("5");
  const [withdrawAmount, setWithdrawAmount] = useState("1");
  const [setupDepositAmount, setSetupDepositAmount] = useState("10");
  const [setupTransferAmount, setSetupTransferAmount] = useState("5");
  const [resetAmount, setResetAmount] = useState("2");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{ rootHash: string; fileName: string } | null>(null);

  // Curriculum Store
  const { 
    secondaryTextbooks, 
    universityCourses, 
    addTextbook, 
    removeTextbook, 
    addCourse, 
    removeCourse,
    setTOC,
    tocs
  } = useCurriculum();

  // Content input states
  const [newType, setNewType] = useState<"textbook" | "course">("textbook");
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [newTocJson, setNewTocJson] = useState("");

  const handleAddCurriculumItem = () => {
    if (!newId || !newName) return;
    const item: LearningItem = {
      id: newId,
      name: newName,
      subtitle: newSubtitle,
      progress: 0,
      timeSpent: "0h",
      lastTopic: "None"
    };
    if (newType === "textbook") addTextbook(item);
    else addCourse(item);
    
    setNewId("");
    setNewName("");
    setNewSubtitle("");
  };

  const handleSaveTOC = () => {
    if (!selectedSubject || !newTocJson) return;
    try {
      const parsed = JSON.parse(newTocJson);
      setTOC(selectedSubject, parsed);
      setActionResult({ type: "success", message: "TOC saved successfully." });
    } catch {
      setActionResult({ type: "error", message: "Invalid JSON format for TOC." });
    }
  };

  // ─── Fetch Account Data ────────────────────────────────
  const fetchAccountData = useCallback(async () => {
    setIsLoadingAccount(true);
    setAccountError(null);
    try {
      const res = await fetch("/api/0g/account/balance");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setAccountData(data);
    } catch (err: unknown) {
      setAccountError(err instanceof Error ? err.message : "Failed to fetch account data");
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "resources") {
      fetchAccountData();
    }
  }, [activeTab, fetchAccountData]);

  // ─── Account Actions ───────────────────────────────────
  const performAction = async (endpoint: string, body: Record<string, unknown>, actionName: string) => {
    setActionLoading(actionName);
    setActionResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setActionResult({ type: "success", message: data.message });
      // Refresh balances after any action
      setTimeout(() => fetchAccountData(), 1500);
    } catch (err: unknown) {
      setActionResult({
        type: "error",
        message: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeposit = () =>
    performAction("/api/0g/account/deposit", { amount: parseFloat(depositAmount) }, "deposit");

  const handleTransfer = () =>
    performAction("/api/0g/account/transfer", { amount: parseFloat(transferAmount) }, "transfer");

  const handleSetup = () =>
    performAction(
      "/api/0g/account/setup",
      {
        depositAmount: parseFloat(setupDepositAmount),
        transferAmount: parseFloat(setupTransferAmount),
      },
      "setup"
    );

  const handleRefundRequest = () =>
    performAction("/api/0g/account/refund", { action: "request" }, "refund-request");

  const handleWithdraw = () =>
    performAction("/api/0g/account/refund", { action: "withdraw", amount: parseFloat(withdrawAmount) }, "withdraw");

  const handleReset = () =>
    performAction("/api/0g/account/reset", { initialBalance: parseFloat(resetAmount) }, "reset");

  // ─── Content Upload ────────────────────────────────────
  const handleContentUpload = async () => {
    if (!uploadFile) return;
    setActionLoading("upload");
    setActionResult(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/0g/storage/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadResult({ rootHash: data.rootHash, fileName: data.fileName });
      setActionResult({ type: "success", message: `Uploaded to 0G Storage. Root hash: ${data.rootHash}` });
    } catch (err: unknown) {
      setActionResult({ type: "error", message: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-6">
        {/* Admin Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-accent-blue" /> Protocol Command Center
          </h1>
          <p className="text-sm font-mono text-foreground/50 mt-1">
            System Monitoring & Protocol Management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-charcoal/50 pb-px">
          <button
            onClick={() => setActiveTab("metrics")}
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === "metrics" ? "border-foreground text-foreground" : "border-transparent text-foreground/50 hover:text-foreground"
            )}
          >
            <Users className="w-4 h-4" /> User Metrics
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === "resources" ? "border-foreground text-foreground" : "border-transparent text-foreground/50 hover:text-foreground"
            )}
          >
            <Activity className="w-4 h-4" /> 0G Resources
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={cn(
              "px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === "content" ? "border-foreground text-foreground" : "border-transparent text-foreground/50 hover:text-foreground"
            )}
          >
            <BookPlus className="w-4 h-4" /> Content Management
          </button>
        </div>

        {/* Action Result Toast */}
        {actionResult && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-sm border text-sm transition-all",
            actionResult.type === "success"
              ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}>
            {actionResult.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1 font-mono text-xs break-all">{actionResult.message}</span>
            <button onClick={() => setActionResult(null)} className="text-foreground/40 hover:text-foreground text-xs">✕</button>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-2">

          {/* ═══ User Metrics Tab ═══ */}
          {activeTab === "metrics" && (
            <div className="grid md:grid-cols-3 gap-6">
              <BentoBox className="flex flex-col">
                <div className="text-xs font-mono uppercase text-foreground/50 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></span> Daily Active Wallets
                </div>
                <div className="text-4xl font-light">12,408</div>
                <div className="mt-auto pt-4 border-t border-charcoal/50 text-xs text-accent-green font-mono">+420 today</div>
              </BentoBox>
              <BentoBox className="flex flex-col">
                <div className="text-xs font-mono uppercase text-foreground/50 mb-4">Avg Session Length</div>
                <div className="text-4xl font-light">42<span className="text-xl text-foreground/40">m</span></div>
                <div className="mt-auto pt-4 border-t border-charcoal/50 text-xs text-foreground/40 font-mono">Stable over 7d</div>
              </BentoBox>
              <BentoBox className="flex flex-col bg-charcoal/20">
                <div className="text-xs font-mono uppercase text-foreground/50 mb-4">Popular Textbooks</div>
                <ul className="text-sm space-y-3">
                  <li className="flex justify-between items-center">
                    <span>New School Physics</span>
                    <span className="font-mono text-accent-blue">4.2k</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>New School Chemistry</span>
                    <span className="font-mono text-accent-blue">3.8k</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Modern Biology</span>
                    <span className="font-mono text-accent-blue">2.1k</span>
                  </li>
                </ul>
              </BentoBox>
            </div>
          )}

          {/* ═══ 0G Resources Tab ═══ */}
          {activeTab === "resources" && (
            <div className="flex flex-col gap-6">
              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAccountData}
                  disabled={isLoadingAccount}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAccount && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {accountError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-sm text-red-400 font-mono">
                  {accountError}
                </div>
              )}

              {/* ── Balance Overview ── */}
              <div className="grid md:grid-cols-3 gap-6">
                <BentoBox>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground/50 mb-4">
                    <Wallet className="w-4 h-4" /> Wallet Balance
                  </div>
                  <div className="text-3xl font-light">
                    {isLoadingAccount ? (
                      <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
                    ) : accountData?.walletBalance ? (
                      <>{parseFloat(accountData.walletBalance).toFixed(4)} <span className="text-lg text-foreground/40">0G</span></>
                    ) : (
                      <span className="text-foreground/30 text-lg">—</span>
                    )}
                  </div>
                  {accountData?.walletError && (
                    <p className="mt-2 text-xs text-red-400 font-mono">{accountData.walletError}</p>
                  )}
                </BentoBox>

                <BentoBox>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground/50 mb-4">
                    <Cpu className="w-4 h-4" /> Main Account
                  </div>
                  <div className="text-3xl font-light">
                    {isLoadingAccount ? (
                      <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
                    ) : accountData?.mainAccount ? (
                      <>{parseFloat(accountData.mainAccount.availableBalance).toFixed(4)} <span className="text-lg text-foreground/40">0G</span></>
                    ) : (
                      <span className="text-foreground/30 text-lg">Not initialized</span>
                    )}
                  </div>
                  {accountData?.mainAccount && (
                    <div className="mt-2 text-xs font-mono text-foreground/40">
                      Total: {parseFloat(accountData.mainAccount.totalBalance).toFixed(4)} 0G
                    </div>
                  )}
                  {accountData?.mainAccountError && (
                    <p className="mt-2 text-xs text-red-400 font-mono">{accountData.mainAccountError}</p>
                  )}
                </BentoBox>

                <BentoBox>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground/50 mb-4">
                    <HardDrive className="w-4 h-4" /> Provider Sub-Account
                  </div>
                  <div className="text-3xl font-light">
                    {isLoadingAccount ? (
                      <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
                    ) : accountData?.subAccount ? (
                      <>{parseFloat(accountData.subAccount.balance).toFixed(4)} <span className="text-lg text-foreground/40">0G</span></>
                    ) : (
                      <span className="text-foreground/30 text-lg">Not initialized</span>
                    )}
                  </div>
                  {accountData?.subAccount?.pendingRefunds && accountData.subAccount.pendingRefunds.length > 0 && (
                    <div className="mt-2 text-xs text-amber-400 font-mono">
                      {accountData.subAccount.pendingRefunds.length} pending refund(s)
                    </div>
                  )}
                  {accountData?.subAccountError && (
                    <p className="mt-2 text-xs text-foreground/40 font-mono">{accountData.subAccountError}</p>
                  )}
                </BentoBox>
              </div>

              {/* ── Provider Info ── */}
              {accountData?.providerAddress && (
                <BentoBox className="bg-charcoal/20">
                  <div className="text-xs font-mono uppercase text-foreground/50 mb-2">Provider Address</div>
                  <p className="text-sm font-mono text-foreground/80 break-all">{accountData.providerAddress}</p>
                </BentoBox>
              )}

              {/* ── Account Actions ── */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* First-Time Setup */}
                <BentoBox className="border-accent-blue/20">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-accent-blue" />
                    <h3 className="font-medium">Provider Setup</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-accent-blue/20 text-accent-blue rounded-sm font-mono">FIRST TIME</span>
                  </div>
                  <p className="text-xs text-foreground/50 mb-4">
                    Deposit funds, transfer to provider, and acknowledge signer in one step.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 block">Deposit (0G)</label>
                      <input
                        type="number"
                        value={setupDepositAmount}
                        onChange={(e) => setSetupDepositAmount(e.target.value)}
                        className="w-full h-9 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 block">Transfer (0G)</label>
                      <input
                        type="number"
                        value={setupTransferAmount}
                        onChange={(e) => setSetupTransferAmount(e.target.value)}
                        className="w-full h-9 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSetup}
                    disabled={actionLoading === "setup"}
                    className="w-full gap-2"
                  >
                    {actionLoading === "setup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Initialize Provider
                  </Button>

                  <div className="mt-4 pt-4 border-t border-charcoal/50">
                    <p className="text-xs text-foreground/40 mb-2">
                      Broken ledger? (availableBalance=0 despite deposits)
                    </p>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-mono text-foreground/50 mb-1 block">New Balance (0G)</label>
                        <input
                          type="number"
                          value={resetAmount}
                          onChange={(e) => setResetAmount(e.target.value)}
                          className="w-full h-9 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={actionLoading === "reset"}
                        className="gap-1 h-9 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        {actionLoading === "reset" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        Reset Ledger
                      </Button>
                    </div>
                  </div>
                </BentoBox>

                {/* Individual Actions */}
                <BentoBox>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent-green" /> Fund Management
                  </h3>
                  <div className="space-y-4">
                    {/* Deposit */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-mono text-foreground/50 mb-1 block">Deposit to Main</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full h-9 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeposit}
                        disabled={actionLoading === "deposit"}
                        className="gap-1 h-9"
                      >
                        {actionLoading === "deposit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                        Deposit
                      </Button>
                    </div>

                    {/* Transfer */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-mono text-foreground/50 mb-1 block">Transfer to Provider</label>
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          className="w-full h-9 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTransfer}
                        disabled={actionLoading === "transfer"}
                        className="gap-1 h-9"
                      >
                        {actionLoading === "transfer" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
                        Transfer
                      </Button>
                    </div>

                    <div className="border-t border-charcoal/50 pt-4 space-y-3">
                      {/* Refund Request */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefundRequest}
                        disabled={actionLoading === "refund-request"}
                        className="w-full gap-2"
                      >
                        {actionLoading === "refund-request" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                        Request Refund (24h Lock)
                      </Button>

                      {/* Withdraw */}
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-xs font-mono text-foreground/50 mb-1 block">Withdraw to Wallet</label>
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full h-9 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleWithdraw}
                          disabled={actionLoading === "withdraw"}
                          className="gap-1 h-9"
                        >
                          {actionLoading === "withdraw" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>
                </BentoBox>
              </div>
            </div>
          )}

          {/* ═══ Content Management Tab ═══ */}
          {activeTab === "content" && (
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Left Column: Manage Subjects */}
              <div className="flex flex-col gap-6">
                <BentoBox className="flex flex-col">
                  <h3 className="font-medium mb-1">Add Textbook or Course</h3>
                  <p className="text-sm text-foreground/50 mb-6">Create a new subject entry in the Hub.</p>
  
                  <div className="space-y-4">
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name="ctype" checked={newType==="textbook"} onChange={()=>setNewType("textbook")} />
                        Textbook
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name="ctype" checked={newType==="course"} onChange={()=>setNewType("course")} />
                        Course
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 block">ID (e.g. sec-phy)</label>
                      <input value={newId} onChange={e=>setNewId(e.target.value)} className="w-full h-10 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue" placeholder="e.g. sec-eng" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 block">Name</label>
                      <input value={newName} onChange={e=>setNewName(e.target.value)} className="w-full h-10 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue" placeholder="e.g. English Language" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 block">Subtitle / Description</label>
                      <input value={newSubtitle} onChange={e=>setNewSubtitle(e.target.value)} className="w-full h-10 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue" placeholder="e.g. Senior Secondary" />
                    </div>
                    <Button onClick={handleAddCurriculumItem} className="w-full mt-2 gap-2">
                      <Plus className="w-4 h-4" /> Add Item
                    </Button>
                  </div>
                </BentoBox>

                <BentoBox className="flex flex-col bg-charcoal/20">
                  <h3 className="font-medium mb-4">Current Textbooks</h3>
                  <ul className="space-y-2">
                    {secondaryTextbooks.map(tb => (
                      <li key={tb.id} className="flex justify-between items-center text-sm bg-obsidian p-2 rounded-sm border border-charcoal">
                        <span>{tb.name} <span className="text-xs text-foreground/40 hidden md:inline">({tb.id})</span></span>
                        <button onClick={() => removeTextbook(tb.id)} className="text-red-400/70 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <h3 className="font-medium mt-6 mb-4">Current Courses</h3>
                  <ul className="space-y-2">
                    {universityCourses.map(c => (
                      <li key={c.id} className="flex justify-between items-center text-sm bg-obsidian p-2 rounded-sm border border-charcoal">
                        <span>{c.name} <span className="text-xs text-foreground/40 hidden md:inline">({c.id})</span></span>
                        <button onClick={() => removeCourse(c.id)} className="text-red-400/70 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </BentoBox>
              </div>

              {/* Right Column: Manage Topics */}
              <div className="flex flex-col gap-6">
                <BentoBox className="flex flex-col">
                  <h3 className="font-medium mb-1">Manage Table of Contents</h3>
                  <p className="text-sm text-foreground/50 mb-6">Edit the JSON array for chapters and topics.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 block">Select Subject</label>
                      <select 
                        value={selectedSubject} 
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedSubject(val);
                          setNewTocJson(val && tocs[val] ? JSON.stringify(tocs[val], null, 2) : "[\n  \n]");
                        }}
                        className="w-full h-10 bg-card border border-charcoal rounded-sm px-3 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      >
                        <option value="">-- Choose Subject --</option>
                        <optgroup label="Textbooks">
                          {secondaryTextbooks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
                        </optgroup>
                        <optgroup label="Courses">
                          {universityCourses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-foreground/50 mb-1 flex justify-between">
                        <span>TOC JSON Data</span>
                        {selectedSubject && tocs[selectedSubject] && <span className="text-accent-green">Has Data</span>}
                      </label>
                      <textarea
                        value={newTocJson}
                        onChange={e => setNewTocJson(e.target.value)}
                        className="w-full h-64 bg-card border border-charcoal rounded-sm p-3 text-xs font-mono focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue custom-scrollbar"
                        placeholder="[ { 'id': 'ch1', 'title': 'Chapter 1', 'type': 'chapter', 'children': [...] } ]"
                      />
                    </div>
                    <Button onClick={handleSaveTOC} disabled={!selectedSubject} className="w-full">
                      Save TOC
                    </Button>
                  </div>
                </BentoBox>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
