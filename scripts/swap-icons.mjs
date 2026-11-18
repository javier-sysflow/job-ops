#!/usr/bin/env node
/**
 * Points every lucide-react import in the orchestrator at the app icon module
 * (orchestrator/src/components/icons.ts, MingCute icons under lucide names).
 *
 * Safe to re-run, e.g. after merging upstream changes that add new
 * lucide-react imports. If a new icon name is missing from icons.ts,
 * `npm --workspace orchestrator run check:types` will say which one.
 *
 * Usage: node scripts/swap-icons.mjs [--check]
 *   --check  exit 1 if any lucide-react import is left (no files written)
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const srcRoot = join(repoRoot, "orchestrator", "src");
const iconModule = join(srcRoot, "components", "icons.ts");
const checkOnly = process.argv.includes("--check");

const patterns = [
  [/from\s+"lucide-react"/g, 'from "@/components/icons"'],
  [/vi\.mock\(\s*"lucide-react"/g, 'vi.mock("@/components/icons"'],
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry)) yield full;
  }
}

const changed = [];
for (const file of walk(srcRoot)) {
  if (file === iconModule) continue;
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [pattern, replacement] of patterns) {
    after = after.replace(pattern, replacement);
  }
  if (after !== before) {
    changed.push(file);
    if (!checkOnly) writeFileSync(file, after);
  }
}

const rel = (file) => relative(repoRoot, file).replaceAll("\\", "/");
if (checkOnly) {
  if (changed.length > 0) {
    console.error(
      `lucide-react imports left in:\n${changed.map(rel).join("\n")}`,
    );
    process.exit(1);
  }
  console.log("No lucide-react imports left.");
  process.exit(0);
}

console.log(`Updated ${changed.length} file(s).`);
if (changed.length > 0) {
  // Re-sort the import blocks the path change touched. Run biome's JS entry
  // with node directly so paths with spaces work without a shell.
  const biome = join(
    repoRoot,
    "orchestrator",
    "node_modules",
    "@biomejs",
    "biome",
    "bin",
    "biome",
  );
  execFileSync(
    process.execPath,
    [biome, "check", "--write", ...changed.map(rel)],
    { cwd: repoRoot, stdio: "inherit" },
  );
}
