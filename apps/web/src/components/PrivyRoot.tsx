"use client";

import { PrivyProvider } from "@privy-io/react-auth";

/** Public Privy app id (safe in the browser). */
export const PRIVY_APP_ID =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmt9hky9c01is0cjoiw60nprw";

export function PrivyRoot({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
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
