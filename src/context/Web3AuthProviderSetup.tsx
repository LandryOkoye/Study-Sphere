"use client";

import React from "react";
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK, WALLET_CONNECTORS } from "@web3auth/modal";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CHAIN_NAMESPACES } from "@web3auth/base";

// Read from your existing env — do NOT change the key name
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";
export const isWeb3AuthConfigured = clientId.trim().length > 0;

const queryClient = new QueryClient();

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chains: [{
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0xaa36a7",
      rpcTarget: "https://rpc.ankr.com/eth_sepolia",
      displayName: "Ethereum Sepolia Testnet",
      blockExplorerUrl: "https://sepolia.etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    }],
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "auth",
          loginMethods: {
            google: {
              name: "google",
              showOnModal: true,
            },
          },
        },
        [WALLET_CONNECTORS.WALLET_CONNECT_V2]: {
          label: "wallet_connect",
          showOnModal: false,
        },
        [WALLET_CONNECTORS.METAMASK]: {
          label: "metamask",
          showOnModal: false,
        },
        [WALLET_CONNECTORS.COINBASE]: {
          label: "coinbase",
          showOnModal: false,
        },
      },
    },
  },
};

export default function Web3AuthProviderSetup({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isWeb3AuthConfigured) {
    return <>{children}</>;
  }

  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>{children}</WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
