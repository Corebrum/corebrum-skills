import type { ReactNode } from "react";

interface Props {
  title: string;
  summary: string;
  filters: ReactNode;
  children: ReactNode;
}

export default function CatalogBrowse({ title, summary, filters, children }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-text-primary">{title}</h1>
      <p className="mt-1 text-sm text-text-secondary">{summary}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="space-y-6">{filters}</aside>
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
}
