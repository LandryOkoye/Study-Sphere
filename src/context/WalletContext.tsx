"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

import { useWeb3AuthContext } from "./Web3AuthContext";

type WalletType = "metamask" | "okx" | "web3auth" | null;

interface Web3AuthUser {
  email?: string;
  name?: string;
  profileImage?: string;
}

interface WalletState {
  address: string | null;
  walletType: WalletType;
  userInfo?: Web3AuthUser | null;
  isConnecting: boolean;
  error: string | null;
  connectMetaMask: () => Promise<string | null>;
  connectOKX: () => Promise<string | null>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

// Helper to shorten an address for display
export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Finds the true MetaMask provider from window.ethereum.
 *
 * The problem: OKX Wallet (and others) inject themselves into window.ethereum
 * and set `isMetaMask = true` to ensure compatibility. This means naive checks
 * like `window.ethereum.isMetaMask` return true even when MetaMask isn't
 * installed.
 *
 * Detection strategy (in priority order):
 *   1. If `window.ethereum.providers` exists (multi-wallet env), scan the list
 *      and find a provider that is MetaMask AND is NOT OKX/Coinbase/Brave.
 *   2. If there's only one injected provider, check it is genuinely MetaMask
 *      and not an OKX impostor.
 *   3. Return null if MetaMask is definitively not present.
 */
function findMetaMaskProvider(): any | null {
  const eth = (window as any).ethereum;
  if (!eth) return null;

  // Multi-wallet environment — ethereum.providers is an array
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    // Prefer a provider that is MetaMask and explicitly NOT any other wallet
    const strict = eth.providers.find(
      (p: any) =>
        p.isMetaMask === true &&
        !p.isOkxWallet &&
        !p.isOKExWallet &&
        !p.isCoinbaseWallet &&
        !p.isBraveWallet &&
        !p.isRabby &&
        !p.isPhantom
    );
    if (strict) return strict;

    // Fallback: just any MetaMask-flagged provider (less safe, but better than nothing)
    const loose = eth.providers.find((p: any) => p.isMetaMask === true);
    return loose ?? null;
  }

  // Single provider — reject if it belongs to another wallet masquerading as MetaMask
  if (
    eth.isOkxWallet ||
    eth.isOKExWallet ||
    eth.isCoinbaseWallet ||
    eth.isBraveWallet
  ) {
    return null;
  }

  // Accept if it at least claims to be MetaMask
  return eth.isMetaMask ? eth : null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isConnected: isWeb3Connected,
    address: web3Address,
    userInfo: web3UserInfo,
    disconnect: web3Disconnect,
  } = useWeb3AuthContext();

  // Track previous Web3Auth connection state to detect transitions
  const prevWeb3Connected = useRef<boolean>(false);

  useEffect(() => {
    const justConnected = isWeb3Connected && !prevWeb3Connected.current;
    const justDisconnected = !isWeb3Connected && prevWeb3Connected.current;

    prevWeb3Connected.current = isWeb3Connected;

    if (justConnected && web3Address) {
      setAddress(web3Address);
      setWalletType("web3auth");
      persist("web3auth");
    } else if (isWeb3Connected && web3Address) {
      // Address resolved asynchronously or changed while connected
      setAddress(web3Address);
      // Ensure wallet type is synced
      setWalletType((prev) => {
        if (prev !== "web3auth") persist("web3auth");
        return "web3auth";
      });
    } else if (justDisconnected) {
      setAddress((prev) => (prev === web3Address ? null : prev));
      setWalletType((prev) => (prev === "web3auth" ? null : prev));
      persist(null);
    }
  }, [isWeb3Connected, web3Address]); // walletType intentionally excluded

  const persist = (type: WalletType) => {
    if (type) {
      localStorage.setItem("wallet_type", type);
    } else {
      localStorage.removeItem("wallet_type");
    }
  };

  // ── MetaMask ─────────────────────────────────────────────
  const connectMetaMask = useCallback(async (): Promise<string | null> => {
    setError(null);
    setIsConnecting(true);

    try {
      // Use the improved provider finder to avoid picking OKX by mistake
      const provider = findMetaMaskProvider();

      if (!provider) {
        throw new Error(
          "MetaMask is not installed. Please install the MetaMask browser extension."
        );
      }

      // Force the wallet to explicitly ask the user which account to connect
      await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts: string[] = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) throw new Error("No accounts returned.");

      setAddress(accounts[0]);
      setWalletType("metamask");
      persist("metamask");
      return accounts[0];
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected by user.");
      } else {
        setError(err.message ?? "Failed to connect MetaMask.");
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── OKX Wallet ───────────────────────────────────────────
  const connectOKX = useCallback(async (): Promise<string | null> => {
    setError(null);
    setIsConnecting(true);

    try {
      const okx = (window as any).okxwallet;
      if (!okx) {
        throw new Error(
          "OKX Wallet is not installed. Please install the OKX Wallet browser extension."
        );
      }

      // Force the wallet to explicitly ask the user which account to connect
      await okx.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts: string[] = await okx.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) throw new Error("No accounts returned.");

      setAddress(accounts[0]);
      setWalletType("okx");
      persist("okx");
      return accounts[0];
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected by user.");
      } else {
        setError(err.message ?? "Failed to connect OKX Wallet.");
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect ───────────────────────────────────────────
  const disconnect = useCallback(() => {
    const currentType = walletType;
    setAddress(null);
    setWalletType(null);
    setError(null);
    persist(null);
    if (currentType === "web3auth") {
      web3Disconnect().catch(console.error);
    }
  }, [walletType, web3Disconnect]);

  // ── Account / chain change listeners ────────────────────
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // MetaMask recommends reloading on chain change
      window.location.reload();
    };

    let provider: any;
    if (walletType === "okx") {
      provider = (window as any).okxwallet;
    } else if (walletType === "metamask") {
      // Use the same improved finder for consistency
      provider = findMetaMaskProvider();
    }

    if (provider && address) {
      provider.on?.("accountsChanged", handleAccountsChanged);
      provider.on?.("chainChanged", handleChainChanged);
    }

    return () => {
      if (provider && address) {
        provider.removeListener?.("accountsChanged", handleAccountsChanged);
        provider.removeListener?.("chainChanged", handleChainChanged);
      }
    };
  }, [walletType, address, disconnect]);

  // Auto-reconnect is intentionally disabled — wallet is stateless.
  // The extension will always prompt the user explicitly on each connection.

  return (
    <WalletContext.Provider
      value={{
        address,
        walletType,
        userInfo: walletType === "web3auth" ? web3UserInfo : null,
        isConnecting,
        error,
        connectMetaMask,
        connectOKX,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}