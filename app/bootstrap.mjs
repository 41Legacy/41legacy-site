// Build bootstrap for Cloudflare Workers Builds.
// The full site source (code, film, images, blog content) is a pinned release
// archive listed in source.json. This script downloads it, verifies its SHA-256,
// unpacks it over this folder, then runs the real install and build. Cloudflare
// then runs `npx wrangler deploy` against the unpacked wrangler.jsonc.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = JSON.parse(readFileSync(resolve(here, "source.json"), "utf8"));

function run(cmd, args, cwd) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: false });
  if (r.status !== 0) {
    console.error(`${cmd} failed with exit code ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

console.log(`Fetching site release ${src.version}`);
const res = await fetch(src.url);
if (!res.ok) {
  console.error(`Download failed: HTTP ${res.status}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
const sum = createHash("sha256").update(buf).digest("hex");
if (sum !== src.sha256) {
  console.error(`Checksum mismatch. Expected ${src.sha256}, got ${sum}`);
  process.exit(1);
}
const archive = resolve(tmpdir(), `site-${src.version}.tgz`);
writeFileSync(archive, buf);
// The Worker name, D1 binding and vars live in this repo's wrangler.jsonc, not the release.
const wrangler = readFileSync(resolve(here, "wrangler.jsonc"), "utf8");
run("tar", ["-xzf", archive, "-C", root], root);
writeFileSync(resolve(here, "wrangler.jsonc"), wrangler);

const hasBun = spawnSync("bun", ["--version"], { stdio: "ignore" }).status === 0;
if (hasBun) {
  run("bun", ["install"], here);
  run("bun", ["run", "build"], here);
} else {
  run("npm", ["install"], here);
  run("npm", ["run", "build"], here);
}
console.log(`Built site release ${src.version}`);
