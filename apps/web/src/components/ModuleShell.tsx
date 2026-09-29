import type { ReactNode } from "react";
import Link from "next/link";
import { PrelaunchNotice } from "@/components/PrelaunchNotice";

export function ModuleShell({
  code,
  title,
  deck,
  children,
}: {
  code: string;
  title: string;
  deck: string;
  children: ReactNode;
}) {
  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">
        <Link href="/explorer" className="no-underline hover:text-[var(--accent)]">
          Index
        </Link>{" "}
        · {code}
      </p>
      <h1 className="masthead page-title mt-2 text-5xl sm:text-6xl">{title}</h1>
      <p className="deck mt-4 max-w-2xl">{deck}</p>
      <div className="mt-8">
        <PrelaunchNotice feature={title} />
      </div>
      <div className="mt-8">{children}</div>
      <p className="mt-8">
        <Link href="/explorer" className="btn btn-ghost">
          ← Back to Index
        </Link>
      </p>
    </div>
  );
}
