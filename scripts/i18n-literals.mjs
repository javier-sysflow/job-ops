#!/usr/bin/env node
/**
 * Lists user-visible string literals that are not translated yet.
 *
 * Usage:
 *   node scripts/i18n-literals.mjs <file-or-dir> [...more]
 *   node scripts/i18n-literals.mjs --summary orchestrator/src/client
 *
 * Flags JSX text, user-facing JSX attributes (placeholder, title,
 * aria-label, alt, label, description, tooltip), and string arguments to
 * toast/notification helpers. A line can opt out with a trailing
 * `// i18n-ignore` comment (brand names, code, URLs).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const USER_FACING_ATTRIBUTES = new Set([
  "placeholder",
  "title",
  "aria-label",
  "alt",
  "label",
  "description",
  "tooltip",
  "emptyMessage",
  "confirmLabel",
  "cancelLabel",
]);
const TOAST_CALLEES = new Set([
  "toast",
  "toast.success",
  "toast.error",
  "toast.warning",
  "toast.info",
  "toast.message",
  "showErrorToast",
  "window.confirm",
  "confirm",
]);

const args = process.argv.slice(2);
const summary = args.includes("--summary");
const targets = args.filter((arg) => !arg.startsWith("--"));
if (targets.length === 0) {
  console.error("Usage: node scripts/i18n-literals.mjs [--summary] <paths...>");
  process.exit(2);
}

function collectFiles(path) {
  const stats = statSync(path);
  if (stats.isFile()) return /\.(tsx|ts)$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((entry) => {
    if (entry === "node_modules" || entry === "i18n") return [];
    return collectFiles(join(path, entry));
  });
}

const isTestFile = (file) => /\.(test|stories|spec)\.tsx?$/.test(file);
const hasLetters = (text) => /\p{L}/u.test(text);

function calleeName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    const left = calleeName(expression.expression);
    return left ? `${left}.${expression.name.text}` : expression.name.text;
  }
  return "";
}

function scanFile(file) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings = [];
  const report = (node, text, kind) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    if (lines[line]?.includes("i18n-ignore")) return;
    findings.push({ line: line + 1, kind, text: text.trim().slice(0, 80) });
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const text = node.getText().replace(/\s+/g, " ").trim();
      if (text && hasLetters(text)) report(node, text, "jsx-text");
    } else if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText();
      const init = node.initializer;
      if (USER_FACING_ATTRIBUTES.has(name)) {
        if (ts.isStringLiteral(init) && hasLetters(init.text)) {
          report(node, init.text, `attr:${name}`);
        } else if (
          ts.isJsxExpression(init) &&
          init.expression &&
          (ts.isStringLiteral(init.expression) ||
            ts.isNoSubstitutionTemplateLiteral(init.expression)) &&
          hasLetters(init.expression.text)
        ) {
          report(node, init.expression.text, `attr:${name}`);
        }
      }
    } else if (ts.isJsxExpression(node) && node.expression) {
      const expression = node.expression;
      if (
        (ts.isStringLiteral(expression) ||
          ts.isNoSubstitutionTemplateLiteral(expression)) &&
        hasLetters(expression.text) &&
        !ts.isJsxAttribute(node.parent)
      ) {
        report(node, expression.text, "jsx-expression");
      }
    } else if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);
      const firstArg = node.arguments[0];
      if (
        TOAST_CALLEES.has(name) &&
        firstArg &&
        (ts.isStringLiteral(firstArg) ||
          ts.isNoSubstitutionTemplateLiteral(firstArg)) &&
        hasLetters(firstArg.text)
      ) {
        report(node, firstArg.text, `call:${name}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

let total = 0;
const perFile = [];
for (const target of targets) {
  for (const file of collectFiles(target)) {
    if (isTestFile(file)) continue;
    const findings = scanFile(file);
    if (findings.length === 0) continue;
    total += findings.length;
    perFile.push([relative(process.cwd(), file), findings]);
  }
}

perFile.sort((left, right) => right[1].length - left[1].length);
for (const [file, findings] of perFile) {
  if (summary) {
    console.log(`${String(findings.length).padStart(4)}  ${file}`);
    continue;
  }
  console.log(`\n${file}`);
  for (const finding of findings) {
    console.log(`  ${finding.line}: [${finding.kind}] ${finding.text}`);
  }
}
console.log(`\n${total} untranslated literal(s) in ${perFile.length} file(s).`);
