/**
 * Read-only report on Jev screening (src/server/services/jev/screen.ts): how
 * stored verdicts compare with Sonnet's scores and with what the user did next.
 *
 *   npm run jev:report              # DATA_DIR/jobs.db (in the container: /app/data)
 *   npm run jev:report -- some.db
 *
 * Prints titles, employers and numbers only, never job descriptions.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

type Signals = {
  unsuitable: number | null;
  differentProfession: number | null;
  fitLevel: number | null;
  locationConflict: number | null;
  missingRequirement: number | null;
};

type Outcome =
  | { ok: true; verdict: string; threshold: number; signals: Signals }
  | { ok: false; reason: string; status?: number };

type Row = {
  jobId: string;
  mode: string;
  version: string;
  verdict: string;
  inputTokens: number | null;
  latencyMs: number | null;
  title: string;
  employer: string;
  status: string;
  sonnet: number | null;
  description: string | null;
  outcome: Outcome;
};

const ADVANCED_STATUSES = new Set(["ready", "applied", "in_progress"]);
const THRESHOLDS = [0.5, 0.6, 0.7, 0.8, 0.9];
const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

const dbPath =
  process.argv[2] ?? join(process.env.DATA_DIR || "./data", "jobs.db");
if (!existsSync(dbPath)) {
  console.error(`No database at ${dbPath}`);
  process.exit(1);
}
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const hasTable = db
  .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
  .get("jev_screens");
if (!hasTable) {
  console.log("No jev_screens table yet: the screening code has not run.");
  process.exit(0);
}

const rows: Row[] = (
  db
    .prepare(
      `SELECT s.job_id AS jobId, s.mode, s.version, s.verdict, s.input_tokens AS inputTokens,
         s.latency_ms AS latencyMs, s.result, j.title, j.employer, j.status,
         j.suitability_score AS sonnet, j.job_description AS description
       FROM jev_screens s JOIN jobs j ON j.id = s.job_id`,
    )
    .all() as Array<Omit<Row, "outcome"> & { result: string }>
).map(({ result, ...row }) => ({
  ...row,
  outcome: JSON.parse(result) as Outcome,
}));

const pct = (part: number, whole: number) =>
  whole ? `${Math.round((100 * part) / whole)}%` : "-";
const isJapanese = (text: string | null) => /[぀-ヿ一-鿿]/.test(text ?? "");
const skipSignal = (signals: Signals) =>
  Math.max(signals.unsuitable ?? 0, signals.differentProfession ?? 0);
const fmt = (value: number | null) => (value == null ? "-" : value.toFixed(2));

console.log(`Jev screening report (${dbPath})\n`);

const counts = new Map<string, number>();
for (const row of rows) {
  const key = `${row.mode} ${row.version} ${row.verdict}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
console.log("Rows by mode, version and verdict:");
for (const [key, count] of [...counts].sort())
  console.log(`  ${key}: ${count}`);

const failures = rows.filter((row) => !row.outcome.ok);
if (failures.length) {
  const reasons = new Map<string, number>();
  for (const row of failures) {
    const reason = row.outcome.ok ? "" : row.outcome.reason;
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  console.log(
    `\nFailed calls: ${failures.length} (${[...reasons].map(([r, n]) => `${r} ${n}`).join(", ")})`,
  );
}

const tokens = rows.reduce((sum, row) => sum + (row.inputTokens ?? 0), 0);
const latencies = rows
  .map((row) => row.latencyMs)
  .filter((value): value is number => value != null)
  .sort((a, b) => a - b);
console.log(
  `\nInput tokens ${tokens.toLocaleString()} (about $${(tokens * USD_PER_INPUT_TOKEN).toFixed(4)}); median latency ${latencies[Math.floor(latencies.length / 2)] ?? "-"} ms`,
);

// Shadow rows with a Sonnet score are the comparison set.
const compared = rows.filter(
  (row): row is Row & { outcome: Extract<Outcome, { ok: true }> } =>
    row.mode === "shadow" && row.outcome.ok && row.sonnet != null,
);
console.log(`\nShadow rows with a Sonnet score: ${compared.length}`);
if (compared.length) {
  console.log(
    "\nIf the gate used threshold t (skip when unsuitable or different-profession >= t):",
  );
  console.log(
    "  t     skips        Sonnet<20  20-39  40-59  60+  max Sonnet  user moved forward",
  );
  for (const t of THRESHOLDS) {
    const skipped = compared.filter(
      (row) => skipSignal(row.outcome.signals) >= t,
    );
    const band = (lo: number, hi: number) =>
      skipped.filter((row) => (row.sonnet ?? 0) >= lo && (row.sonnet ?? 0) < hi)
        .length;
    const maxSonnet = skipped.length
      ? Math.max(...skipped.map((row) => row.sonnet ?? 0))
      : "-";
    const advanced = skipped.filter((row) =>
      ADVANCED_STATUSES.has(row.status),
    ).length;
    console.log(
      `  ${t.toFixed(2)}  ${String(skipped.length).padStart(4)} (${pct(skipped.length, compared.length).padStart(4)})  ${String(band(0, 20)).padStart(9)}  ${String(band(20, 40)).padStart(5)}  ${String(band(40, 60)).padStart(5)}  ${String(band(60, 101)).padStart(3)}  ${String(maxSonnet).padStart(10)}  ${advanced}`,
    );
  }

  for (const language of ["en", "ja"] as const) {
    const subset = compared.filter(
      (row) => (isJapanese(row.description) ? "ja" : "en") === language,
    );
    const skipped = subset.filter((row) => row.outcome.verdict === "skip");
    const risky = skipped.filter((row) => (row.sonnet ?? 0) >= 40).length;
    console.log(
      `\n${language === "ja" ? "Japanese" : "English"} listings: ${subset.length}, would skip ${skipped.length} (${pct(skipped.length, subset.length)}), of which Sonnet scored 40+: ${risky}; Sonnet 40+ in total: ${subset.filter((row) => (row.sonnet ?? 0) >= 40).length}`,
    );
  }

  const worrying = compared
    .filter(
      (row) =>
        row.outcome.verdict === "skip" &&
        ((row.sonnet ?? 0) >= 40 || ADVANCED_STATUSES.has(row.status)),
    )
    .sort((a, b) => (b.sonnet ?? 0) - (a.sonnet ?? 0));
  console.log(
    `\nWould-skip jobs that Sonnet scored 40+ or the user moved forward: ${worrying.length}`,
  );
  for (const row of worrying.slice(0, 25)) {
    const s = row.outcome.signals;
    console.log(
      `  [${row.sonnet}] ${row.status} | ${row.title} at ${row.employer} | unsuitable ${fmt(s.unsuitable)} different ${fmt(s.differentProfession)} location ${fmt(s.locationConflict)} requirement ${fmt(s.missingRequirement)}`,
    );
  }
}

const gated = rows.filter(
  (row) => row.mode === "gate" && row.verdict === "skip",
);
if (gated.length) {
  const reopened = gated.filter((row) => row.status !== "skipped");
  console.log(
    `\nGate skipped ${gated.length} jobs; ${reopened.length} were later moved out of skipped by the user:`,
  );
  for (const row of reopened.slice(0, 25)) {
    console.log(`  ${row.status} | ${row.title} at ${row.employer}`);
  }
}
