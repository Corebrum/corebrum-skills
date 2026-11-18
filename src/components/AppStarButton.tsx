import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { setAppStar } from "../lib/api";

interface Props {
  id: string;
  starCount: number;
  onStarCountChange: (count: number) => void;
}

export default function AppStarButton({ id, starCount, onStarCountChange }: Props) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [rating, setRating] = useState<{ starred: boolean; starCount: number }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (user) {
      setAppStar({ id }).then((data) => {
        if (active) setRating(data);
      }).catch(() => {
        if (active) setError("Your star could not be loaded. Reload to try again.");
      });
    }
    return () => { active = false; };
  }, [id, user]);

  async function toggle() {
    if (!rating || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await setAppStar({ id, starred: !rating.starred });
      setRating(data);
      onStarCountChange(data.starCount);
    } catch {
      setError("Your star could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const buttonClass = "inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm hover:bg-bg-elevated";
  if (loading || !user) {
    return <Link className={buttonClass} to={`/login?redirect=${encodeURIComponent(pathname)}`}>☆ Star · {starCount}</Link>;
  }

  return (
    <div>
      <button type="button" className={buttonClass} aria-pressed={rating?.starred ?? false}
        disabled={!rating || busy} onClick={toggle}>
        {rating?.starred ? "★ Starred" : "☆ Star"} · {rating?.starCount ?? starCount}
      </button>
      {error && <p className="mt-2 text-sm text-coral-bright" role="alert">{error}</p>}
    </div>
  );
}
