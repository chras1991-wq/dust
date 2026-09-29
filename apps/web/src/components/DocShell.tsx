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
    <article className="mx-auto max-w-3xl px-4 py-12">
      <span className="pill pill-chrome">{section}</span>
      <h1 className="chrome-text mt-4 text-4xl sm:text-5xl">{title}</h1>
      <div className="panel-y2k mt-8 space-y-5 text-[var(--ink-dim)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-[var(--pink)] [&_code]:font-mono [&_code]:text-lg [&_code]:text-[var(--cyan)]">
        {children}
      </div>
    </article>
  );
}

export function DocBack() {
  return (
    <p className="pt-4">
      <Link href="/docs" className="btn btn-ghost">
        ← Lore index
      </Link>
    </p>
  );
}
