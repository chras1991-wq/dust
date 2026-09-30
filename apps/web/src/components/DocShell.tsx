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
    <article className="page-shell max-w-3xl py-10 sm:py-14">
      <p className="byline">{section}</p>
      <h1 className="masthead mt-2 text-4xl sm:text-5xl md:text-6xl">{title}</h1>
      <div className="mt-8 space-y-5 text-[var(--ink-soft)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-[var(--ink)] [&_code]:font-mono [&_code]:text-[0.9rem] [&_code]:text-[var(--accent)]">
        {children}
      </div>
    </article>
  );
}

export function DocBack() {
  return (
    <p className="pt-6">
      <Link href="/docs" className="btn btn-ghost">
        ← Archive
      </Link>
    </p>
  );
}
