import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { AppRecord } from "../lib/api";
import AppStarButton from "./AppStarButton";

interface Props {
  apps: AppRecord[];
  onStarCountChange: (id: string, count: number) => void;
}

export default function AppGrid({ apps, onStarCountChange }: Props) {
  const { user } = useAuth();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((item) => (
        <li key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-bg-surface/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/apps/${item.id}`} className="break-words font-display font-semibold text-cyan-bright hover:underline">
                {item.title}
              </Link>
              <p className="mt-1 truncate text-xs text-text-muted" title={item.id}>{item.id}</p>
            </div>
            <AppStarButton
              key={user?.uid ?? ""}
              id={item.id}
              title={item.title}
              starCount={item.starCount ?? 0}
              compact
              onStarCountChange={(count) => onStarCountChange(item.id, count)}
            />
          </div>
          <p className="mt-3 text-sm text-text-secondary">{item.description}</p>
          <p className="mt-4 text-xs text-text-muted">{item.tags.join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}
