import Link from "next/link";

export function DocShell({
  title,
  section,
  children,
}: {
  title: string;
  section: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <p className="section-num">{section}</p>
      <h1 className="font-display mt-2 text-4xl">{title}</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-dim)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-[var(--ink)] [&_code]:font-mono [&_code]:text-[0.85rem] [&_code]:text-[var(--accent)]">
        {children}
      </div>
    </article>
  );
}

export function DocBack() {
  return (
    <p className="pt-6">
      <Link href="/docs">← Spec index</Link>
    </p>
  );
}
