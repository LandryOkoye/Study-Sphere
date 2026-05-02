"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
} from "@web3auth/modal/react";
import { WALLET_CONNECTORS } from "@web3auth/modal";
import { isWeb3AuthConfigured } from "./Web3AuthProviderSetup";

interface Web3AuthUser {
  email?: string;
  name?: string;
  profileImage?: string;
}

interface Web3AuthState {
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  userInfo: Web3AuthUser | null;
  address: string | null;
  connectWithGoogle: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  error: string | null;
}

const DISABLED_ERROR =
  "Google sign-in is unavailable because NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not configured.";

const Web3AuthCtx = createContext<Web3AuthState | undefined>(undefined);

function DisabledWeb3AuthContextProvider({ children }: { children: ReactNode }) {
  const connectWithGoogle = useCallback(async () => false, []);
  const disconnect = useCallback(async () => {}, []);

  return (
    <Web3AuthCtx.Provider
      value={{
        isConnected: false,
        isConnecting: false,
        isInitialized: false,
        userInfo: null,
        address: null,
        connectWithGoogle,
        disconnect,
        error: DISABLED_ERROR,
      }}
    >
      {children}
    </Web3AuthCtx.Provider>
  );
}

function EnabledWeb3AuthContextProvider({ children }: { children: ReactNode }) {
  const { isConnected, provider, isInitialized } = useWeb3Auth();
  const { userInfo } = useWeb3AuthUser();
  const { connectTo } = useWeb3AuthConnect();
  const { disconnect: web3authDisconnect } = useWeb3AuthDisconnect();

  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddress = async () => {
      if (isConnected && provider) {
        try {
          const accounts = await provider.request<never, string[]>({
            method: "eth_accounts",
          });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0] ?? null);
            return;
          }
        } catch {
          // ignore and fall through to null state
        }
      }
      setAddress(null);
    };

    fetchAddress();
  }, [isConnected, provider]);

  const connectWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      setError("Authentication SDK is still initializing. Please wait a moment and try again.");
      return false;
    }

    setError(null);
    setIsConnecting(true);

    try {
      if (isConnected) {
        try {
          await web3authDisconnect();
        } catch {}
      }

      await connectTo(WALLET_CONNECTORS.AUTH, {
        authConnection: "google",
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect with Google";
      const isUserClosed =
        message.toLowerCase().includes("user closed") ||
        message.toLowerCase().includes("popup closed") ||
        message.toLowerCase().includes("cancelled");

      if (!isUserClosed) {
        setError(message);
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [connectTo, isConnected, isInitialized, web3authDisconnect]);

  const disconnect = useCallback(async () => {
    try {
      await web3authDisconnect();
      setAddress(null);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to disconnect";
      setError(message);
    }
  }, [web3authDisconnect]);

  const parsedUserInfo: Web3AuthUser | null =
    isConnected && userInfo
      ? {
          email: userInfo.email ?? undefined,
          name: userInfo.name ?? undefined,
          profileImage: userInfo.profileImage ?? undefined,
        }
      : null;

  return (
    <Web3AuthCtx.Provider
      value={{
        isConnected,
        isConnecting,
        isInitialized,
        userInfo: parsedUserInfo,
        address,
        connectWithGoogle,
        disconnect,
        error,
      }}
    >
      {children}
    </Web3AuthCtx.Provider>
  );
}

export function Web3AuthContextProvider({ children }: { children: ReactNode }) {
  if (!isWeb3AuthConfigured) {
    return <DisabledWeb3AuthContextProvider>{children}</DisabledWeb3AuthContextProvider>;
  }

  return <EnabledWeb3AuthContextProvider>{children}</EnabledWeb3AuthContextProvider>;
}

export function useWeb3AuthContext() {
  const ctx = useContext(Web3AuthCtx);
  if (!ctx) {
    throw new Error("useWeb3AuthContext must be used inside Web3AuthContextProvider");
  }
  return ctx;
}
