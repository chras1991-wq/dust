"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { PRIVY_APP_ID } from "@/lib/privy";

export function PrivyRoot({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "apple", "twitter", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#c41230",
          landingHeader: "",
          loginMessage: "",
          showWalletLoginFirst: true,
          walletChainType: "ethereum-only",
          walletList: ["detected_ethereum_wallets", "wallet_connect"],
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
