import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SignInWithGithubButton from "../components/SignInWithGithubButton";
import { publishAppRelease } from "../lib/api";
import { getGithubAccessToken } from "../lib/githubToken";

export default function SubmitApp() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [releaseUrl, setReleaseUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!getGithubAccessToken()) await signIn();
      const githubAccessToken = getGithubAccessToken();
      if (!githubAccessToken) throw new Error("Sign in again to verify repository access.");
      const data = await publishAppRelease({ releaseUrl: releaseUrl.trim(), githubAccessToken });
      navigate(`/apps/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Publish an app</h1>
      <p className="text-text-secondary">
        Attach your <code>corebrum-app.json</code> and app archives to a public GitHub release.
        Sign in with an account that can push to that repository. Valid releases go live immediately.
      </p>
      <a className="text-cyan-bright hover:underline" href="https://github.com/Corebrum/corebrum-os/blob/master/docs/development/corebrum-apps.md">
        Read the app publishing guide
      </a>
      {loading ? <p role="status">Loading…</p> : user ? (
        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            GitHub release URL
            <input type="url" required maxLength={512} value={releaseUrl}
              onChange={(event) => setReleaseUrl(event.target.value)}
              placeholder="https://github.com/owner/app/releases/tag/v1.0.0"
              className="mt-2 block w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2" />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-cyan-bright px-4 py-2 font-medium text-white disabled:opacity-60">
            {busy ? "Publishing…" : "Publish app"}
          </button>
          {error && <p role="alert" className="text-coral-bright">{error}</p>}
        </form>
      ) : <SignInWithGithubButton redirectTo="/publish/app" />}
    </section>
  );
}
