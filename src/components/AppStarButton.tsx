import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { setAppStar } from "../lib/api";

interface Props {
  id: string;
  title: string;
  starCount: number;
  compact?: boolean;
  onStarCountChange: (count: number) => void;
}

export default function AppStarButton({ id, title, starCount, compact = false, onStarCountChange }: Props) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();
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

  const count = rating?.starCount ?? starCount;
  const color = count > 0 ? "text-accent-bright" : "text-text-muted hover:text-accent-bright";
  const buttonClass = `inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] transition hover:bg-bg-elevated ${color} ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`;
  const starred = rating?.starred ?? false;
  const label = `${starred ? "Unstar" : "Star"} ${title} (${count} ${count === 1 ? "star" : "stars"})`;
  const content = <>
    <span aria-hidden="true">{starred ? "★" : "☆"}</span>
    <span>{compact ? count : `${starred ? "Starred" : "Star"} · ${count}`}</span>
  </>;
  if (loading || !user) {
    return (
      <Link className={buttonClass} aria-label={label} title={label}
        to={`/login?redirect=${encodeURIComponent(pathname + search)}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={compact ? "text-right" : undefined}>
      <button type="button" className={buttonClass} aria-pressed={starred}
        aria-label={label} title={label} disabled={!rating || busy} onClick={toggle}>
        {content}
      </button>
      {error && <p className="mt-2 text-xs text-coral-bright" role="alert">{error}</p>}
    </div>
  );
}
