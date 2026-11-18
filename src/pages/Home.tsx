import { Link } from "react-router-dom";

const sections = [
  {
    title: "Apps",
    description: "Run standalone robotics tools on Corebrum OS. Find depth viewers, measurement tools, and CUDA demos for your hardware.",
    command: "corebrum apps search RealSense",
    link: "/apps",
  },
  {
    title: "Skills",
    description: "Give your Corebrum Synapse agent tools it can call. Find skills for perception, navigation, and interaction.",
    command: "synapse skills search vision",
    link: "/skills",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-8 pt-14 md:pt-24">
      <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
        Corebrum Marketplace
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-text-secondary">
        Discover and share robotics apps and agent skills for Physical AI.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {sections.map(({ title, description, command, link }) => (
          <section key={title} className="flex flex-col items-start rounded-2xl border border-[var(--border-subtle)] bg-bg-surface/60 p-6 md:p-8">
            <h2 className="font-display text-3xl font-semibold">{title}</h2>
            <p className="mb-6 mt-3 text-text-secondary">{description}</p>
            <code className="mb-6 mt-auto rounded-md bg-bg-elevated px-3 py-2 text-sm text-coral-bright">
              {command}
            </code>
            <Link to={link} className="rounded-lg bg-cyan-bright px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-mid">
              Browse {title.toLowerCase()}
            </Link>
          </section>
        ))}
      </div>
      <Link to="/publish" className="mt-8 inline-block text-sm text-cyan-bright hover:underline">
        Publish an app or skill
      </Link>
    </div>
  );
}
