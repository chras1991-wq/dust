import Link from "next/link";

export function PrelaunchNotice({
  feature,
  detail,
}: {
  feature: string;
  detail?: string;
}) {
  return (
    <div className="panel-edit border-[var(--accent)]">
      <p className="kicker">Pending migration</p>
      <h2 className="font-display mt-2 text-2xl sm:text-3xl">{feature} desk</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--ink-soft)] sm:text-[0.95rem]">
        {detail ??
          "Migrates when the first mint batch completes. Desk UI is ready; execution follows Genesis mint and indexer feeds."}
      </p>
      <div className="btn-row mt-6">
        <Link href="/explorer" className="btn btn-solid">
          Open Index
        </Link>
        <Link href="/docs/dust20" className="btn btn-ghost">
          Read DUST-20
        </Link>
      </div>
    </div>
  );
}

export function FeatureEntry({
  href,
  code,
  title,
  blurb,
}: {
  href: string;
  code: string;
  title: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className="panel-edit feature-card group block no-underline transition-colors hover:border-[var(--accent)]"
    >
      <p className="byline text-[var(--accent)]">{code}</p>
      <h3 className="font-display mt-2 text-2xl text-[var(--ink)] group-hover:text-[var(--accent)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--ink-mute)]">{blurb}</p>
      <p className="mt-4 font-condensed text-[0.72rem] uppercase tracking-[0.14em] text-[var(--ink)]">
        Enter →
      </p>
    </Link>
  );
}
