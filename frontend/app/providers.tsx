"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { ValidatorProvider } from "@/lib/ValidatorContext";

import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet"),
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ValidatorProvider>
            {children}
          </ValidatorProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
