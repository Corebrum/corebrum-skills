import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppGrid from "../components/AppGrid";
import SignInWithGithubButton from "../components/SignInWithGithubButton";
import { useAuth } from "../contexts/AuthContext";
import { listMyApps, type AppRecord } from "../lib/api";

export default function MyApps() {
  const { user, loading } = useAuth();
  if (loading) return <p className="mx-auto max-w-2xl px-6 py-12" role="status">Loading…</p>;
  if (!user) {
    return (
      <section className="mx-auto max-w-2xl space-y-6 px-6 py-12 text-center">
        <h1 className="font-display text-3xl font-semibold">Sign in to see your apps</h1>
        <SignInWithGithubButton redirectTo="/my-apps" />
      </section>
    );
  }
  return <PublishedApps key={user.uid} />;
}

function PublishedApps() {
  const [apps, setApps] = useState<AppRecord[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listMyApps().then((result) => {
      if (active) setApps(result.apps);
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "Your apps could not be loaded.");
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">My apps</h1>
        <Link to="/publish/app" className="rounded-lg bg-cyan-bright px-4 py-2 text-sm font-medium text-white hover:bg-cyan-mid">
          Publish an app
        </Link>
      </div>
      {error && <p role="alert" className="text-coral-bright">{error}</p>}
      {!apps && !error && <p role="status">Loading your apps…</p>}
      {apps?.length === 0 && <p className="text-text-secondary">You haven’t published any apps yet.</p>}
      {apps && <AppGrid apps={apps} onStarCountChange={(id, starCount) =>
        setApps((current) => current?.map((app) => app.id === id ? { ...app, starCount } : app))
      } />}
    </section>
  );
}
