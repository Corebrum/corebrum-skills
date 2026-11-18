import { Link } from "react-router-dom";

export default function Publish() {
  const linkClass = "text-cyan-bright hover:underline";

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Publish a listing</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border-subtle)] bg-bg-surface/60 p-6">
          <h2 className="font-display text-2xl font-semibold">Publish an app</h2>
          <p className="my-3 text-text-secondary">
            Submit a public GitHub release with the app manifest and archives. Valid releases publish immediately after automated checks.
          </p>
          <Link to="/publish/app" className={linkClass}>Publish an app</Link>
        </article>
        <article className="rounded-2xl border border-[var(--border-subtle)] bg-bg-surface/60 p-6">
          <h2 className="font-display text-2xl font-semibold">Publish a skill</h2>
          <p className="my-3 text-text-secondary">
            Submit a GitHub repository with a Corebrum Synapse skill that an agent can discover and call.
          </p>
          <Link to="/submit" className={linkClass}>Submit a skill</Link>
        </article>
      </div>
    </section>
  );
}
