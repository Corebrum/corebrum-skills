import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

const categories = ["RealSense", "ROS 2", "CUDA"];

export default function Apps() {
  const { owner, app } = useParams();
  const [apps, setApps] = useState<App[]>();
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [arch, setArch] = useState("");
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

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-semibold">{selected?.title || "Corebrum Apps"}</h1>
      {error && <p role="alert">The Apps catalog could not be loaded.</p>}
      {!error && !apps && <p role="status">Loading apps…</p>}
      {owner && <Link to="/apps" className="underline">Browse apps</Link>}
      {owner && apps && !selected && <p>App not found.</p>}
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
      {!owner && apps && (
        <>
          <div className="flex flex-wrap gap-4">
            <label>Search <input className="rounded bg-bg-elevated p-2" value={query}
              onChange={(event) => setQuery(event.target.value)} /></label>
            <label>Category <select className="rounded bg-bg-elevated p-2" value={category}
              onChange={(event) => setCategory(event.target.value)}>
              <option value="">All</option>
              {categories.map((tag) => <option key={tag}>{tag}</option>)}
            </select></label>
            <label>Architecture <select className="rounded bg-bg-elevated p-2" value={arch}
              onChange={(event) => setArch(event.target.value)}>
              <option value="">All</option><option>amd64</option><option>arm64</option>
            </select></label>
          </div>
          {results?.length === 0 && <p>{apps.length ? "No apps match your filters." : "No releases have been approved yet."}</p>}
          <ul className="grid gap-4 sm:grid-cols-2">
            {results?.map((item) => (
              <li key={item.id} className="space-y-2 rounded border p-4">
                <Link to={`/apps/${item.id}`} className="font-semibold underline">{item.title}</Link>
                <p>{item.description}</p>
                <p>{item.tags.join(", ")}</p>
              </li>
            ))}
          </ul>
          <a className="underline" href="https://github.com/Corebrum/corebrum-os/blob/master/docs/decisions/0139-apps-catalog.md">
            Submit an app for review
          </a>
        </>
      )}
    </section>
  );
}
