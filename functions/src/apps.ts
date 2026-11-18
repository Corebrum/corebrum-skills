import { isDeepStrictEqual } from "node:util";
import type { DecodedIdToken } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "./admin";
import { verifyOwnership } from "./github";
import seeds from "./app-seeds.json";
import { appIdPattern, parseReleaseUrl, validateAppManifest, type AppRecord, type ReleaseAsset } from "./util/app-manifest";
import { ManifestError } from "./util/manifest";

export interface AppRequest<Input> {
  auth?: { uid: string; token: DecodedIdToken };
  data: Input;
}

type PublishedApp = { app: AppRecord; starCount: number };
const collection = db.collection("apps");
const seedApps = new Map((seeds.apps as AppRecord[]).map((app) => [app.id, app]));
const docId = (id: string) => id.replace("/", ":");

export async function listApps() {
  const apps = new Map<string, PublishedApp>(
    [...seedApps].map(([id, app]) => [id, { app, starCount: 0 }]),
  );
  const published = await collection.get();
  for (const doc of published.docs) {
    const { app, starCount } = doc.data() as PublishedApp;
    apps.set(app.id, { app, starCount });
  }
  return {
    schemaVersion: 1,
    apps: [...apps.values()].map(({ app, starCount }) => ({ ...app, starCount })),
  };
}

export async function publishApp(request: AppRequest<{ releaseUrl: string; githubAccessToken: string }>) {
  const githubIds = request.auth?.token.firebase?.identities?.["github.com"];
  if (!request.auth || !githubIds?.length) {
    throw new HttpsError("unauthenticated", "Sign in with GitHub to publish an app.");
  }
  try {
    const { releaseUrl, githubAccessToken } = request.data ?? {};
    if (typeof githubAccessToken !== "string" || !githubAccessToken || githubAccessToken.length > 1024) {
      throw new ManifestError("Sign in again to verify GitHub repository access.");
    }
    const { owner, repo, tag } = parseReleaseUrl(releaseUrl);
    const access = await verifyOwnership(owner, repo, githubAccessToken);
    if (!githubIds.includes(String(access.viewerId)) || !access.hasPushAccess || access.repo.private) {
      throw new HttpsError("permission-denied", "Publishing requires push access to the public GitHub repository.");
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubAccessToken}`,
          "User-Agent": "corebrum-marketplace",
        },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) throw new ManifestError("GitHub could not find the tagged release.");
    const release = await response.json() as { draft: boolean; assets: ReleaseAsset[] };
    if (release.draft) throw new ManifestError("Publish the GitHub release before submitting it.");
    const manifest = release.assets.find((asset) => asset.name === "corebrum-app.json" && asset.state === "uploaded");
    if (!manifest || manifest.size > 65_536) {
      throw new ManifestError("Attach a corebrum-app.json manifest under 64 KiB to the public release.");
    }
    const asset = await fetch(manifest.browser_download_url, { signal: AbortSignal.timeout(15_000) });
    if (!asset.ok) throw new ManifestError("The public app manifest could not be downloaded.");
    const body = await asset.text();
    if (Buffer.byteLength(body) > 65_536) throw new ManifestError("The app manifest is too large.");
    let data: unknown;
    try { data = JSON.parse(body); }
    catch { throw new ManifestError("The app manifest must contain valid JSON."); }
    const app = validateAppManifest(data, access.repo.full_name, release.assets);

    await db.runTransaction(async (transaction) => {
      const ref = collection.doc(docId(app.id));
      const snap = await transaction.get(ref);
      const published = snap.data() as PublishedApp | undefined;
      const current = published?.app ?? seedApps.get(app.id);
      if (current && current.source.toLowerCase() !== app.source.toLowerCase()) {
        throw new HttpsError("already-exists", "That app ID is already registered to another repository.");
      }
      const incoming = app.releases[0];
      const previous = current?.releases ?? [];
      const existing = previous.find(({ version }) => version === incoming.version);
      if (existing && !isDeepStrictEqual(existing, incoming)) {
        throw new HttpsError("already-exists", "That version already exists. Publish changes under a new version.");
      }
      const updated = { ...app, releases: existing ? previous : [...previous, incoming] };
      if (Buffer.byteLength(JSON.stringify(updated)) > 500_000) {
        throw new HttpsError("resource-exhausted", "The stored app listing is too large.");
      }
      transaction.set(ref, { app: updated, starCount: published?.starCount ?? 0 });
    });
    return { id: app.id };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    if (err instanceof ManifestError) throw new HttpsError("invalid-argument", err.message);
    console.error("App publishing failed", err instanceof Error ? err.name : "Unknown error");
    throw new HttpsError("internal", "Publishing failed. Check the GitHub release and try again.");
  }
}

export async function appStar(request: AppRequest<{ id: string; starred?: boolean }>) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to star apps.");
  const { id, starred } = request.data ?? {};
  if (typeof id !== "string" || !appIdPattern.test(id) || (starred !== undefined && typeof starred !== "boolean")) {
    throw new HttpsError("invalid-argument", "Invalid app or star state.");
  }

  return db.runTransaction(async (transaction) => {
    const ref = collection.doc(docId(id));
    const starRef = ref.collection("stars").doc(uid);
    const [snap, star] = await Promise.all([transaction.get(ref), transaction.get(starRef)]);
    const published = snap.data() as PublishedApp | undefined;
    const app = published?.app ?? seedApps.get(id);
    if (!app) throw new HttpsError("not-found", "App not found.");
    const count = published?.starCount ?? 0;
    if (starred === undefined || starred === star.exists) {
      return { starred: star.exists, starCount: count };
    }
    const starCount = starred ? count + 1 : Math.max(0, count - 1);
    if (starred) transaction.set(starRef, { createdAt: FieldValue.serverTimestamp() });
    else transaction.delete(starRef);
    transaction.set(ref, { app, starCount });
    return { starred, starCount };
  });
}
