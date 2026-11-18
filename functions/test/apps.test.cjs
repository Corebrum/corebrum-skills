const assert = require("node:assert/strict");
const { beforeEach, test } = require("node:test");

const documents = new Map();
function document(path) {
  return { path, collection: (name) => ({ doc: (id) => document(`${path}/${name}/${id}`) }) };
}
const db = {
  collection(name) {
    return {
      doc: (id) => document(`${name}/${id}`),
      get: async () => ({
        docs: [...documents].filter(([path]) => path.startsWith(`${name}/`) && path.split("/").length === 2)
          .map(([, data]) => ({ data: () => data })),
      }),
    };
  },
  runTransaction: async (callback) => callback({
    get: async ({ path }) => ({ exists: documents.has(path), data: () => documents.get(path) }),
    set: ({ path }, data) => documents.set(path, structuredClone(data)),
    delete: ({ path }) => documents.delete(path),
  }),
};
require.cache[require.resolve("../lib/admin")] = {
  exports: { db, FieldValue: { serverTimestamp: () => 123 } },
};
const { appStar, listApps, publishApp } = require("../lib/apps");

const repository = "https://github.com/owner/example";
const releaseUrl = `${repository}/releases/tag/v1.0.0`;
const download = `${repository}/releases/download/v1.0.0`;
const digest = "1".repeat(64);
const manifestAsset = {
  name: "corebrum-app.json", browser_download_url: `${download}/corebrum-app.json`,
  state: "uploaded", size: 1200,
};
const tarball = {
  name: "example.tar.gz", browser_download_url: `${download}/example.tar.gz`,
  state: "uploaded", digest: `sha256:${digest}`,
};
const auth = (uid, github = "99") => ({ uid, token: { firebase: { identities: { "github.com": [github] } } } });
const submit = (identity = auth("publisher")) =>
  publishApp({ auth: identity, data: { releaseUrl, githubAccessToken: "fixture" } });
let manifest;
let access;

beforeEach(() => {
  documents.clear();
  access = true;
  manifest = {
    id: "owner/example", source: repository, title: "Example", description: "A demo",
    license: "MIT", interface: "terminal", tags: ["Demo"],
    releases: [{
      version: "1.0.0", entry: "run", targets: [{
        ubuntu: "24.04", arch: "arm64", hardware: ["Thor"], requirements: [],
        url: tarball.browser_download_url, sha256: digest,
      }],
    }],
  };
});

function mockGithub(t) {
  t.mock.method(global, "fetch", async (url) => {
    switch (url) {
      case "https://api.github.com/user":
        return Response.json({ id: 99, login: "contributor" });
      case "https://api.github.com/repos/owner/example":
        return Response.json({ full_name: "owner/example", private: false, permissions: { push: access } });
      case "https://api.github.com/repos/owner/example/releases/tags/v1.0.0":
        return Response.json({ draft: false, assets: [manifestAsset, tarball] });
      case manifestAsset.browser_download_url:
        return Response.json(manifest);
      default:
        assert.fail(`Unexpected fetch to ${url}`);
    }
  });
}

test("a verified public release is immediately discoverable alongside the pilots", async (t) => {
  mockGithub(t);
  assert.deepEqual(await submit(), { id: "owner/example" });
  const catalog = await listApps();
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.apps.length, 4);
  assert.deepEqual(catalog.apps.find(({ id }) => id === "owner/example"), { ...manifest, starCount: 0 });
  assert.deepEqual(await submit(), { id: "owner/example" });
  assert.equal((await listApps()).apps.length, 4);
});

test("rejects invalid permissions, mismatched identity, and an invalid checksum", async (t) => {
  mockGithub(t);
  access = false;
  await assert.rejects(submit(), { code: "permission-denied" });
  access = true;
  await assert.rejects(submit(auth("publisher", "42")), { code: "permission-denied" });
  manifest.releases[0].targets[0].sha256 = "0".repeat(64);
  await assert.rejects(submit(), { code: "invalid-argument", message: /SHA-256/ });
  assert.equal((await listApps()).apps.length, 3);
});

test("previously published versions keep their install metadata", async (t) => {
  mockGithub(t);
  await submit();
  manifest.releases[0].entry = "changed";
  await assert.rejects(submit(), { code: "already-exists" });
  manifest.releases[0].version = "1.1.0";
  await submit();
  const published = (await listApps()).apps.find(({ id }) => id === "owner/example");
  assert.deepEqual(published.releases.map(({ version, entry }) => [version, entry]),
    [["1.0.0", "run"], ["1.1.0", "changed"]]);
});

test("each signed-in account can add or remove one star on an existing pilot", async () => {
  const id = "chrismatthieu/boxes";
  const rate = (uid, starred) => appStar({ auth: auth(uid), data: { id, starred } });
  await assert.rejects(appStar({ data: { id, starred: true } }), { code: "unauthenticated" });
  assert.deepEqual(await rate("one"), { starred: false, starCount: 0 });
  assert.deepEqual(await rate("one", true), { starred: true, starCount: 1 });
  assert.deepEqual(await rate("one", true), { starred: true, starCount: 1 });
  assert.deepEqual(await rate("two", true), { starred: true, starCount: 2 });
  assert.deepEqual(await rate("one", false), { starred: false, starCount: 1 });
  assert.deepEqual(await rate("one", false), { starred: false, starCount: 1 });
  assert.equal((await listApps()).apps.find((app) => app.id === id).starCount, 1);
});
