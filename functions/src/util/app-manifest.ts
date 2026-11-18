import { ManifestError } from "./manifest";

export const appIdPattern = /^[a-z0-9][a-z0-9-]{0,62}\/[a-z0-9][a-z0-9-]{0,62}$/;
const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const shaPattern = /^[0-9a-f]{64}$/;

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  digest: string | null;
  size: number;
  state: string;
}

interface Target {
  ubuntu: string;
  arch: string;
  hardware: string[];
  requirements: string[];
  commands?: string[];
  url: string;
  sha256: string;
}

interface AppRelease {
  version: string;
  entry: string;
  requirementsFile?: string;
  targets: Target[];
}

export interface AppRecord {
  id: string;
  title: string;
  description: string;
  source: string;
  license: string;
  interface: "terminal" | "graphical";
  tags: string[];
  releases: AppRelease[];
}

function requireValue(value: unknown, message: string): asserts value {
  if (!value) throw new ManifestError(message);
}

function object(value: unknown): Record<string, unknown> {
  requireValue(value && typeof value === "object" && !Array.isArray(value), "Expected an object in the app manifest.");
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, limit: number): string {
  requireValue(typeof value === "string" && value.trim() && value.length <= limit &&
    !/[\x00-\x1f\x7f]/.test(value), `Invalid ${field}.`);
  return value;
}

function strings(value: unknown, field: string, limit = 32): string[] {
  requireValue(Array.isArray(value) && value.length <= limit, `Invalid ${field}.`);
  return value.map((item) => text(item, field, 500));
}

function path(value: unknown, field: string): string {
  const entry = text(value, field, 256);
  const parts = entry.split("/");
  requireValue(parts.every((part) => part && part !== ".." && part !== ".") &&
    ![".venv", ".corebrum.json"].includes(parts[0]), `Invalid app-relative ${field}.`);
  return entry;
}

export function parseReleaseUrl(value: unknown) {
  const input = text(value, "GitHub release URL", 512);
  const match = /^https:\/\/github\.com\/([a-z\d-]+)\/([\w.-]+)\/releases\/tag\/([^/?#]+)\/?$/i.exec(input);
  requireValue(match && match[2] !== "." && match[2] !== "..", "Enter a public GitHub release URL with a tag.");
  let tag;
  try { tag = decodeURIComponent(match[3]); }
  catch { throw new ManifestError("Invalid GitHub release tag."); }
  requireValue(/^[\w.-][\w./-]{0,127}$/.test(tag) &&
    tag.split("/").every((part) => part && part !== "." && part !== ".."), "Invalid GitHub release tag.");
  return { owner: match[1], repo: match[2], tag };
}

export function validateAppManifest(input: unknown, repo: string, assets: ReleaseAsset[]): AppRecord {
  const app = object(input);
  const id = text(app.id, "app ID", 127);
  requireValue(appIdPattern.test(id) && id.split("/")[0] === repo.split("/")[0].toLowerCase(),
    "Use a lowercase owner/app ID under the GitHub repository owner.");
  const source = `https://github.com/${repo}`;
  requireValue(typeof app.source === "string" && app.source.toLowerCase() === source.toLowerCase(),
    "The manifest source must be the GitHub repository for the submitted release.");
  requireValue(app.interface === "terminal" || app.interface === "graphical",
    "Interface must be terminal or graphical.");
  requireValue(Array.isArray(app.releases) && app.releases.length === 1,
    "Include exactly one release in each submission manifest.");
  const release = object(app.releases[0]);
  const version = text(release.version, "version", 32);
  requireValue(versionPattern.test(version), "Use MAJOR.MINOR.PATCH for the version.");
  const entry = path(release.entry, "entry point");
  const requirementsFile = release.requirementsFile === undefined
    ? undefined : path(release.requirementsFile, "requirements file");
  requireValue(Array.isArray(release.targets) && release.targets.length >= 1 && release.targets.length <= 4,
    "Declare one to four release targets.");
  const seen = new Set<string>();
  const targets = release.targets.map((value): Target => {
    const target = object(value);
    const { ubuntu, arch } = target;
    requireValue((ubuntu === "24.04" || ubuntu === "26.04") && (arch === "amd64" || arch === "arm64"),
      "Targets must use Ubuntu 24.04 or 26.04 and amd64 or arm64.");
    const key = `${ubuntu}/${arch}`;
    requireValue(!seen.has(key), `Duplicate target ${key}.`);
    seen.add(key);
    const hardware = strings(target.hardware, "tested hardware");
    requireValue(hardware.length, "List tested hardware for each target.");
    const sha256 = text(target.sha256, "SHA-256", 64);
    const asset = assets.find((item) => item.browser_download_url === target.url &&
      item.state === "uploaded" && item.name.endsWith(".tar.gz"));
    requireValue(asset, "Each target URL must be a .tar.gz asset attached to the submitted GitHub release.");
    requireValue(shaPattern.test(sha256) && asset.digest === `sha256:${sha256}`,
      `SHA-256 does not match GitHub's digest for ${asset.name}.`);
    return {
      ubuntu, arch, hardware, sha256,
      url: asset.browser_download_url,
      requirements: strings(target.requirements, "runtime requirements"),
      ...(target.commands === undefined ? {} : { commands: strings(target.commands, "commands") }),
    };
  });
  return {
    id, source, interface: app.interface,
    title: text(app.title, "title", 120),
    description: text(app.description, "description", 500),
    license: text(app.license, "license", 120),
    tags: strings(app.tags, "tags"),
    releases: [{ version, entry, targets, ...(requirementsFile ? { requirementsFile } : {}) }],
  };
}
