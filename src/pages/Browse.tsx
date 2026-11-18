import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listSkills, type SkillRecord } from "../lib/api";
import CatalogBrowse from "../components/CatalogBrowse";
import SearchBar from "../components/SearchBar";
import SkillGrid from "../components/SkillGrid";

const CATEGORIES = [
  "navigation",
  "vision",
  "human-interaction",
  "manipulation",
  "search",
  "audio",
  "communication",
  "telemetry",
];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = (params.get("sort") === "popular" ? "popular" : "recent") as
    | "popular"
    | "recent";

  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    listSkills({ q, category: category || undefined, sort, limit: 100 })
      .then((s) => {
        if (!cancelled) setSkills(s);
      })
      .catch((err) => {
        console.error("Failed to list skills", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, category, sort]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next);
  }

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (q) parts.push(`matching "${q}"`);
    if (category) parts.push(`in ${category}`);
    return parts.join(" ");
  }, [q, category]);

  return (
    <CatalogBrowse
      title="Skills"
      summary={loading ? "Loading…" : error ? "" : `${skills.length} skill${skills.length === 1 ? "" : "s"} ${summary}`.trim()}
      filters={
        <>
          <div>
            <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-text-muted">
              Sort
            </h3>
            <div className="flex flex-col gap-1">
              <SortLink active={sort === "recent"} onClick={() => update({ sort: null })}>
                Recently added
              </SortLink>
              <SortLink
                active={sort === "popular"}
                onClick={() => update({ sort: "popular" })}
              >
                Most starred
              </SortLink>
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-text-muted">
              Category
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <CategoryChip
                active={!category}
                onClick={() => update({ category: null })}
              >
                All
              </CategoryChip>
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c}
                  active={category === c}
                  onClick={() => update({ category: c })}
                >
                  {c}
                </CategoryChip>
              ))}
            </div>
          </div>
        </>
      }
    >
      <SearchBar key={q} size="sm" initialValue={q} placeholder="Search skills" />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-bg-elevated/30"
            />
          ))}
        </div>
      ) : error ? (
        <p role="alert">The Skills catalog could not be loaded.</p>
      ) : (
        <SkillGrid
          skills={skills}
          emptyMessage={q || category ? "No skills match those filters." : "No skills yet."}
        />
      )}
    </CatalogBrowse>
  );
}

function SortLink({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2 py-1 text-left text-sm transition ${
        active
          ? "bg-bg-elevated text-coral-bright"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
        active
          ? "border-coral-bright bg-coral-bright/10 text-coral-bright"
          : "border-[var(--border-subtle)] text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
