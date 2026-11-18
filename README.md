# Corebrum Marketplace

[Corebrum Marketplace](https://skills.corebrum.com) is the catalog for robotics
apps and Synapse skills. This repository contains its React SPA and Firebase
Cloud Functions.

- [Apps](https://skills.corebrum.com/apps) are standalone tools that run on Corebrum OS.
  The site and the OS CLI read the versioned catalog at `/apps/v1/catalog.json`.
- [Skills](https://skills.corebrum.com/skills) add tools an agent can call through
  Corebrum Synapse. The catalog stores metadata and links to the source repositories.
- [Publish](https://skills.corebrum.com/publish) links to the review process for
  app release manifests and the submission form for skills.

Existing `/browse`, listing, and install API URLs are supported. The web
browse pages share a layout and keep filters in the URL. Apps use the static
catalog, and Skills use the existing browse API.

## What is a Corebrum Synapse skill?

A skill is an npm package the [Corebrum Synapse](https://github.com/Corebrum/corebrum-synapse) plugin loads at startup. Each skill registers tools the AI agent can call (e.g. "follow me", "find object"), reads its config from `config.skills.<skillId>`, and uses the plugin context for ROS2 transport and depth sampling.

See **[synapse/docs/skills.md](https://github.com/Corebrum/corebrum-synapse/blob/main/docs/skills.md)** for the skill contract.

Corebrum Synapse robot skills are npm packages with a `synapse` block that install via `npx @corebrum/synapse skills install`. Third-party [Agent Skills](https://agentskills.io/home) (`SKILL.md` catalogs) are not indexed here. For official maker catalogs (including NVIDIA) see **[skills.sh/official](https://www.skills.sh/official)**; for Jetson Device and BSP workflows see **[Jetson Agent Skills](https://www.jetson-ai-lab.com/tutorials/jetson-agent-skills/)**.

## Install a skill on your robot

```bash
# Search the marketplace
npx @corebrum/synapse skills search follow

# Prefer npm @corebrum/* when listed; else git clone + build.
# Registers skillPaths/skillRefs, syncs contracts.tools, auto-restarts gateway.
npx @corebrum/synapse skills install @corebrum/followme
npx @corebrum/synapse skills install chrismatthieu/followme

# Skip automatic OpenClaw gateway restart:
npx @corebrum/synapse skills install @corebrum/navigate-to --no-restart
```

Skills use **namespaced refs** `owner/skill-id` and/or scoped npm names `@corebrum/<slug>`. Legacy flat slugs still resolve.

The CLI calls `https://skills.corebrum.com/api/skills/:owner/:skill/install`. When `npmPackage` is present it packs into `~/.synapse/skills-cache/`; otherwise it clones GitHub and builds.

## Submit a skill

**CLI (recommended):**

```bash
npx @corebrum/synapse create-skill my-skill
cd corebrum-skill-my-skill && npm install && npm run dev
npx @corebrum/synapse publish
```

**Web UI:**

1. Sign in at **[skills.corebrum.com/login](https://skills.corebrum.com/login)** with GitHub.
2. Paste your skill's GitHub repo URL into the Submit form.
3. We fetch `package.json` from GitHub, validate the `synapse` block, verify you have push access on the repo, then publish your listing.

Your skill `package.json` must include:

```jsonc
{
  "name": "corebrum-skill-<id>",
  "main": "dist/index.js",
  "repository": { "type": "git", "url": "https://github.com/<you>/<repo>.git" },
  "synapse": {
    "id": "<id>",
    "displayName": "Your Skill",
    "description": "One-sentence summary.",
    "categories": ["navigation", "vision"],
    "screenshots": ["docs/screenshot.png"],
    "capabilities": [
      { "id": "do_thing", "verb": "do", "description": "...", "requires": ["base", "camera"] }
    ]
  }
}
```

Use **[corebrum-skill-followme](https://github.com/Corebrum/corebrum-skill-followme)** as a reference ([chrismatthieu/followme](https://skills.corebrum.com/chrismatthieu/followme) on the marketplace).

## Develop locally

```bash
npm install
npm run dev          # SPA on http://localhost:5174

# Cloud Functions + Firestore emulators
cd functions && npm install && cd -
npm run emulators

# Deploy (requires Firebase auth + Blaze plan)
npm run deploy
```

## Deployment

- **Hosting**: Firebase Hosting on `skills.corebrum.com` (custom domain configured in Firebase Console)
- **API**: Cloud Functions, reverse-proxied via `/api/**` rewrites
- **DB**: Cloud Firestore (production mode, `nam5`)
- **Auth**: Firebase Auth — GitHub OAuth provider only
- **Analytics**: Google Analytics 4 (`G-ZD9TN0RXBT`)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for first-time setup (GitHub OAuth App, custom domain DNS, Blaze plan, etc.).

## License

Apache-2.0
