import { redirect } from "next/navigation";

/** Mint desk retired — Index (/explorer) is live. */
export default function MintPage() {
  redirect("/explorer");
}
