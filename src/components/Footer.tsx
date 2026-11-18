import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AGENT_SKILLS_LINKS } from "../lib/agentSkillsLinks";

export default function Footer() {
  const { githubLogin } = useAuth();
  const mySkillsPath = githubLogin ? `/${githubLogin}` : "/my-skills";

  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] bg-bg-surface/40 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          <div className="col-span-2">
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
            <p className="mt-3 max-w-md text-sm text-text-secondary">
              Discover robotics apps for Corebrum OS and skills for Corebrum Synapse.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
              Marketplace
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>
                <Link to="/apps" className="hover:text-text-primary">Apps</Link>
              </li>
              <li>
                <Link to="/skills" className="hover:text-text-primary">Skills</Link>
              </li>
              <li>
                <Link to="/publish" className="hover:text-text-primary">
                  Publish a listing
                </Link>
              </li>
              <li>
                <Link to="/my-apps" className="hover:text-text-primary">My apps</Link>
              </li>
              <li>
                <Link to={mySkillsPath} className="hover:text-text-primary">
                  My skills
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
              Corebrum Synapse
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>
                <a
                  href="https://corebrum.com/synapse"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary"
                >
                  Website
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Corebrum/corebrum-synapse"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Corebrum/corebrum-synapse/blob/main/docs/skills.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary"
                >
                  Skill contract
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
              Agent Skills
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              {AGENT_SKILLS_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-text-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start gap-2 border-t border-[var(--border-subtle)] pt-6 text-xs text-text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Corebrum Synapse. Apache-2.0 licensed.</p>
        </div>
      </div>
    </footer>
  );
}
