import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SignInWithGithubButton from "./SignInWithGithubButton";

export default function Header() {
  const { user, loading, signOut, githubLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const mySkillsPath = githubLogin ? `/${githubLogin}` : "/my-skills";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-bg-deep/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
        <Link to="/" className="flex h-10 items-center gap-2" aria-label="Corebrum Marketplace home">
          <img
            src="/corebrum-logo.png"
            alt="Corebrum"
            className="h-8 w-auto object-contain"
          />
          <span className="shrink-0 text-sm font-semibold text-coral-bright">
            Marketplace
          </span>
        </Link>

        <nav aria-label="Marketplace" className="order-last flex w-full items-center gap-5 md:order-none md:w-auto">
          {[
            { to: "/apps", label: "Apps" },
            { to: "/skills", label: "Skills" },
            { to: "/publish", label: "Publish" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-md px-2 py-1 text-sm font-medium transition ${isActive
                  ? "bg-bg-elevated text-coral-bright"
                  : "text-text-secondary hover:text-text-primary"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-text-muted">…</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                to={mySkillsPath}
                className="hidden text-sm text-text-secondary transition hover:text-text-primary md:block"
              >
                My skills
              </Link>
              <Link to="/profile" className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? ""}
                    className="h-8 w-8 rounded-full border border-[var(--border-subtle)]"
                  />
                )}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-text-secondary transition hover:bg-bg-elevated hover:text-text-primary md:block"
              >
                Sign out
              </button>
            </div>
          ) : (
            <SignInWithGithubButton size="sm" />
          )}
        </div>
      </div>
    </header>
  );
}
