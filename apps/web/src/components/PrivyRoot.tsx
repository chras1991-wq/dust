"use client";

import { PrivyProvider } from "@privy-io/react-auth";

function privyAppId(): string {
  const id = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  if (!id) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not configured");
  }
  return id;
}

export function PrivyRoot({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAppId()}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "light",
          accentColor: "#8f1d2c",
          landingHeader: "Connect wallet",
          showWalletLoginFirst: true,
          walletChainType: "ethereum-only",
          walletList: [
            "okx_wallet",
            "phantom",
            "bitget_wallet",
            "detected_ethereum_wallets",
            "wallet_connect",
          ],
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
