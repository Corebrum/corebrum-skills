import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import CatalogBrowse from "../components/CatalogBrowse";
import SearchBar from "../components/SearchBar";

interface Target {
  ubuntu: string;
  arch: string;
  hardware: string[];
  requirements: string[];
  commands?: string[];
}

interface App {
  id: string;
  title: string;
  description: string;
  source: string;
  license: string;
  interface: string;
  tags: string[];
  releases: { version: string; targets: Target[] }[];
}

export default function Apps() {
  const { owner, app } = useParams();
  const [apps, setApps] = useState<App[]>();
  const [error, setError] = useState(false);
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const arch = params.get("arch") ?? "";
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/apps/v1/catalog.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((data) => {
        if (data.schemaVersion !== 1 || !Array.isArray(data.apps)) {
          throw new Error("Invalid catalog");
        }
        setApps(data.apps);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => setCopyStatus(""), [owner, app]);

  const selected = apps?.find((item) => item.id === `${owner}/${app}`);
  const results = apps?.filter((item) =>
    [
      item.title, item.id, item.description, ...item.tags,
      ...item.releases.flatMap((release) => release.targets.flatMap((target) => target.hardware)),
    ].join(" ").toLowerCase().includes(query.trim().toLowerCase()) &&
    (!category || item.tags.includes(category)) &&
    (!arch || item.releases.some((release) => release.targets.some((target) => target.arch === arch))),
  );

  if (!owner) {
    const categories = Array.from(new Set(apps?.flatMap((item) => item.tags) ?? [])).sort();

    function updateFilter(key: string, value: string) {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next);
    }

    return (
      <CatalogBrowse
        title="Apps"
        summary={apps ? `${results?.length ?? 0} app${results?.length === 1 ? "" : "s"}` : error ? "" : "Loading…"}
        filters={
          <>
            <label className="block text-sm text-text-secondary">
              Category
              <select className="mt-2 block w-full rounded-md bg-bg-elevated p-2" value={category}
                onChange={(event) => updateFilter("category", event.target.value)}>
                <option value="">All categories</option>
                {categories.map((tag) => <option key={tag}>{tag}</option>)}
              </select>
            </label>
            <label className="block text-sm text-text-secondary">
              Architecture
              <select className="mt-2 block w-full rounded-md bg-bg-elevated p-2" value={arch}
                onChange={(event) => updateFilter("arch", event.target.value)}>
                <option value="">All architectures</option>
                <option>amd64</option><option>arm64</option>
              </select>
            </label>
          </>
        }
      >
        <SearchBar key={query} size="sm" initialValue={query} placeholder="Search apps" />
        {error && <p role="alert">The Apps catalog could not be loaded.</p>}
        {results?.length === 0 && <p>{apps?.length ? "No apps match your filters." : "No releases have been approved yet."}</p>}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results?.map((item) => (
            <li key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-bg-surface/60 p-5">
              <Link to={`/apps/${item.id}`} className="font-display font-semibold text-cyan-bright hover:underline">{item.title}</Link>
              <p className="mt-1 text-xs text-text-muted">{item.id}</p>
              <p className="mt-3 text-sm text-text-secondary">{item.description}</p>
              <p className="mt-4 text-xs text-text-muted">{item.tags.join(", ")}</p>
            </li>
          ))}
        </ul>
      </CatalogBrowse>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-semibold">{selected?.title || "Corebrum Apps"}</h1>
      {error && <p role="alert">The Apps catalog could not be loaded.</p>}
      {!error && !apps && <p role="status">Loading apps…</p>}
      <Link to="/apps" className="underline">Browse apps</Link>
      {apps && !selected && <p>App not found.</p>}
      {selected && (
        <>
          <p>{selected.description}</p>
          <p>{selected.license} · {selected.interface} · {selected.tags.join(", ")}</p>
          <a href={selected.source} className="underline">Source repository</a>
          <div className="flex flex-wrap items-center gap-3">
            <code>corebrum apps install {selected.id}</code>
            <button type="button" className="rounded border px-3 py-1" onClick={async () => {
              try {
                await navigator.clipboard.writeText(`corebrum apps install ${selected.id}`);
                setCopyStatus("Copied");
              } catch {
                setCopyStatus("Select and copy the command above.");
              }
            }}>Copy install command</button>
            <span role="status">{copyStatus}</span>
          </div>
          {selected.releases.map((release) => (
            <article key={release.version} className="space-y-2 rounded border p-4">
              <h2 className="font-semibold">{release.version}</h2>
              {release.targets.map((target) => (
                <div key={`${target.ubuntu}-${target.arch}`} className="space-y-1">
                  <h3>Ubuntu {target.ubuntu} · {target.arch}</h3>
                  <p>{target.hardware.join(", ")}</p>
                  <ul className="list-disc pl-6">
                    {[...target.requirements, ...(target.commands ?? [])].map((item, index) =>
                      <li key={index}>{item}</li>
                    )}
                  </ul>
                </div>
              ))}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
