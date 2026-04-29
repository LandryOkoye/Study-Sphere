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

const Web3AuthCtx = createContext<Web3AuthState | undefined>(undefined);

export function Web3AuthContextProvider({ children }: { children: ReactNode }) {
  const { isConnected, provider, isInitialized } = useWeb3Auth();
  const { userInfo } = useWeb3AuthUser();

  const { connectTo } = useWeb3AuthConnect();
  const { disconnect: web3authDisconnect } = useWeb3AuthDisconnect();

  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the wallet address from the provider once connected
  useEffect(() => {
    const fetchAddress = async () => {
      if (isConnected && provider) {
        try {
          const accounts = await provider.request<never, string[]>({
            method: "eth_accounts",
          });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0] ?? null);
          }
        } catch {
          setAddress(null);
        }
      } else {
        setAddress(null);
      }
    };
    fetchAddress();
  }, [isConnected, provider]);

  const connectWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      setError("Authentication SDK is still initializing — please wait a moment and try again.");
      return false;
    }

    setError(null);
    setIsConnecting(true);

    try {
      // Always log out any cached session first so the Google account picker
      // popup is shown every time, regardless of prior session state.
      if (isConnected) {
        try { await web3authDisconnect(); } catch { /* ignore if already logged out */ }
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
  }, [connectTo, isInitialized, isConnected, web3authDisconnect]);

  //TODO: Implement proper disconnect logic that also clears any cached sessions if needed

  // Build a clean user info object only when actually connected
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

export function useWeb3AuthContext() {
  const ctx = useContext(Web3AuthCtx);
  if (!ctx)
    throw new Error(
      "useWeb3AuthContext must be used inside Web3AuthContextProvider"
    );
  return ctx;
}