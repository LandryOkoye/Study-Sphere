"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Wallet, ArrowRight, ShieldCheck, Hexagon, AlertCircle } from "lucide-react";
// TODO: Replace with actual Web3Auth context and wallet hooks

export default function AuthPage() {
  const router = useRouter();

  const {
    address: walletAddress,
    isConnecting: isWalletConnecting,
    error: walletError,
    connectMetaMask,
    connectOKX,
  } = useWallet();

  const {
    isConnected: isWeb3AuthConnected,
    isConnecting: isWeb3AuthConnecting,
    isInitialized: isWeb3AuthInitialized,
    address: web3AuthAddress,
    error: web3AuthError,
    connectWithGoogle,
  } = useWeb3AuthContext();

  const shouldRedirect = useRef(false);

  useEffect(() => {
    if (!shouldRedirect.current) return;

    const web3AuthReady = isWeb3AuthConnected && !!web3AuthAddress;
    const nativeWalletReady = !!walletAddress;

    if (web3AuthReady || nativeWalletReady) {
      router.push("/hub");
    }
  }, [walletAddress, isWeb3AuthConnected, web3AuthAddress, router]);

  // --- MetaMask handler ---
  const handleMetaMask = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const addr = await connectMetaMask();
    if (addr) {
      shouldRedirect.current = true;
    }
  };

  // --- OKX handler ---
  const handleOKX = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const addr = await connectOKX();
    if (addr) {
      shouldRedirect.current = true;
    }
  };

  // --- Google handler ---
  const handleGoogleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const success = await connectWithGoogle();
    if (success) {
      shouldRedirect.current = true;
    }
  };

  const isConnecting = isWalletConnecting || isWeb3AuthConnecting;
  const error = walletError || web3AuthError;

  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans relative overflow-hidden selection:bg-charcoal selection:text-foreground">
      {/* Geometric Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1a1c23 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Nav */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="StudySphere Logo"
            width={24}
            height={24}
            className="group-hover:opacity-80 transition-opacity"
            priority
          />
          <span className="font-bold tracking-tight text-lg">StudySphere</span>
        </Link>
        <div className="font-mono text-xs text-foreground/40 hidden sm:flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Secure
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 w-full">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center sm:text-center">
            <h1 className="text-4xl font-semibold tracking-tight mb-2">
              Get Started
            </h1>
            <p className="text-foreground/60 text-sm">
              Sign in with Google instantly or connect your decentralized wallet
              to get started.
            </p>
          </div>

          <div className="bg-card border border-charcoal/80 p-8 rounded-sm shadow-2xl">
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2 mb-6 p-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Option — Primary */}
            <Button
              variant="outline"
              disabled={isConnecting || !isWeb3AuthInitialized}
              className="w-full justify-center h-14 gap-3 bg-white hover:bg-zinc-100 text-black border-transparent transition-colors mt-4 text-sm sm:text-base"
              onClick={handleGoogleLogin}
            >
              <>
                {isWeb3AuthConnecting ? (
                  <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="font-semibold">
                  {isWeb3AuthConnecting
                    ? "Connecting..."
                    : !isWeb3AuthInitialized
                      ? "Initializing..."
                      : "Sign in with Google"}
                </span>
              </>
            </Button>

            <div className="relative flex items-center py-6 mt-4 mb-2">
              <div className="flex-grow border-t border-charcoal/60" />
              <span className="flex-shrink-0 mx-4 text-foreground/40 text-xs font-mono uppercase">
                Web3 Auth
              </span>
              <div className="flex-grow border-t border-charcoal/60" />
            </div>

            {/* Wallet Options */}
            <div className="flex flex-col gap-5 mb-6">
              <Button
                variant="outline"
                className="w-full justify-between h-14 px-6 bg-charcoal/20 border-charcoal hover:bg-charcoal/60 transition-colors text-sm sm:text-base"
                onClick={handleMetaMask}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-foreground/70" />
                  <span className="font-medium">
                    {isWalletConnecting ? "Connecting..." : "MetaMask"}
                  </span>
                </div>
                {isWalletConnecting ? (
                  <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground/80 rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-foreground/40" />
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-14 px-6 bg-charcoal/20 border-charcoal hover:bg-charcoal/60 transition-colors text-sm sm:text-base"
                onClick={handleOKX}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3">
                  <Hexagon className="w-5 h-5 text-foreground/70" />
                  <span className="font-medium">
                    {isWalletConnecting ? "Connecting..." : "OKX Wallet"}
                  </span>
                </div>
                {isWalletConnecting ? (
                  <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground/80 rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-foreground/40" />
                )}
              </Button>
            </div>

            <div className="mt-8 text-center text-xs text-foreground/40 font-mono">
              Secured by Web3Auth
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}