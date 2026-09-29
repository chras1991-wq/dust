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
      <span className="sticker sticker-yellow" style={{ ["--rot" as string]: "-2deg" }}>
        {section}
      </span>
      <h1 className="font-display mt-4 text-5xl font-extrabold uppercase leading-none text-[var(--c-cream)]">
        {title}
      </h1>
      <div className="panel-chaos mt-8 space-y-5 text-[var(--ink-dim)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-[var(--c-yellow)] [&_code]:font-mono [&_code]:text-[0.85rem] [&_code]:text-[var(--c-cyan)]">
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
