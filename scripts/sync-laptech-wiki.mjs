#!/usr/bin/env node
// Sync docs/laptech into the laptech-wiki git repository.
//
// technical-documents stays the source of truth. This script renders
// GitLab-flavoured Markdown for ONE destination:
//   https://gitlab.com/laptech/laptech-wiki.git
//
//   - DRY-RUN IS THE DEFAULT. It prints the page list and a short diff.
//   - --apply writes files into --out, a LOCAL clone of that repository.
//     It never runs git, never pushes, and never calls the GitLab API.
//   - Paths with a segment that starts with "_" are never published
//     (docs/laptech/_private, and any future private folder).
//   - Other products (ff-restaurent, lingu-flow) and docs/guides are out of scope.
//
// Usage:
//   node scripts/sync-laptech-wiki.mjs [--out <clone>] [--quiet-diff] [--apply]
//
// README.md in the destination is the generated index. Edit docs/laptech, then
// re-run this script. Do not edit generated pages in the wiki clone.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const laptechDir = path.join(repoRoot, "docs", "laptech");
const GITHUB_BLOB = "https://github.com/newtc22222/technical-documents/blob/main/docs";
const MARKER = "Generated from technical-documents:";
const SCRIPT_NAME = "scripts/sync-laptech-wiki.mjs";

const args = process.argv.slice(2);
const val = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(name);
const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(2);
};

const apply = has("--apply");
if (apply && has("--dry-run")) fail("--apply and --dry-run are mutually exclusive");
const outDir = val("--out");
const quietDiff = has("--quiet-diff");
if (apply && !outDir) fail("--apply requires --out <local clone of laptech-wiki>");
if (apply && !fs.existsSync(path.join(outDir, ".git"))) {
  fail(`--out '${outDir}' is not a git clone`);
}
if (outDir && !fs.existsSync(outDir)) console.warn(`warn: --out '${outDir}' missing, diffing against empty`);

const readText = (file) => fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
const posix = (p) => p.split(path.sep).join("/");
const warnings = [];
const warn = (page, message) => warnings.push(`${page}: ${message}`);

function walk(dir, base, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (/\.(md|mdx)$/.test(entry.name)) out.push({ full, rel: posix(path.relative(base, full)) });
  }
  return out;
}

function splitFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { fm: {}, body: text };
  const fm = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return { fm, body: text.slice(match[0].length) };
}

const ADMON = {
  note: "Note",
  tip: "Tip",
  info: "Info",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger",
  important: "Important",
};

const published = new Map(walk(laptechDir, laptechDir).map((page) => [page.rel, page]));

function githubLink(relUnderDocs) {
  const clean = relUnderDocs.replace(/\.(md|mdx)$/, "");
  return `${GITHUB_BLOB}/${clean}.md`;
}

function toRelative(fromRel, hit, hash) {
  let rel = posix(path.posix.relative(path.posix.dirname(fromRel), hit));
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel + hash;
}

function publishedHit(underLaptech) {
  const bare = underLaptech.replace(/\.(md|mdx)$/, "").replace(/\/$/, "");
  return [`${bare}.md`, `${bare}.mdx`, `${bare}/index.md`, `${bare}/index.mdx`].find((candidate) => published.has(candidate));
}

function resolveLink(fromRel, href) {
  const hashAt = href.indexOf("#");
  const pathPart = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  if (!pathPart) return href;
  if (/^(https?:|mailto:)/.test(pathPart)) return href;

  let decoded = pathPart;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    warn(fromRel, `link '${href}' has a bad escape; left as text`);
    return null;
  }

  if (decoded.startsWith("/docs/laptech/")) {
    const hit = publishedHit(decoded.slice("/docs/laptech/".length));
    if (hit) return toRelative(fromRel, hit, hash);
    warn(fromRel, `link '${href}' is under docs/laptech but is not published; left as text`);
    return null;
  }
  if (decoded.startsWith("/docs/")) {
    warn(fromRel, `link '${href}' is outside docs/laptech; pointed at technical-documents`);
    return githubLink(decoded.slice("/docs/".length)) + hash;
  }

  const local = posix(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), decoded)));
  if (!local.startsWith("..")) {
    const hit = publishedHit(local);
    if (hit) return toRelative(fromRel, hit, hash);
  } else {
    const outside = posix(path.posix.normalize(path.posix.join("laptech", path.posix.dirname(fromRel), decoded)));
    warn(fromRel, `link '${href}' is outside docs/laptech; pointed at technical-documents`);
    return githubLink(outside) + hash;
  }

  warn(fromRel, `link '${href}' does not resolve inside docs/laptech; left as text`);
  return null;
}

function convert(page) {
  const raw = readText(page.full);
  const { fm, body: original } = splitFrontMatter(raw);
  const parts = original.split(/(^```[\s\S]*?^```[ \t]*$)/m);
  for (let i = 0; i < parts.length; i += 2) {
    let text = parts[i];
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    text = text.replace(/^\s*(import|export)\s.+$/gm, (statement) => {
      warn(page.rel, `removed MDX statement: ${statement.trim().slice(0, 60)}`);
      return "";
    });
    text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    text = text.replace(/^:::(\w+)(?:\[([^\]]*)\]|[ \t]+(.+))?[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm, (_, type, titleA, titleB, inner) => {
      const label = ADMON[type.toLowerCase()] ?? "Note";
      if (!ADMON[type.toLowerCase()]) warn(page.rel, `unknown admonition ':::${type}' rendered as Note`);
      const title = (titleA ?? titleB ?? "").trim();
      const head = `> **${label}${title ? ": " + title : ""}**`;
      return [head, ">", ...inner.split("\n").map((line) => (line ? `> ${line}` : ">"))].join("\n");
    });
    if (/<(Tabs|TabItem|CodeBlock|Details)\b/.test(text)) {
      warn(page.rel, "JSX components left as-is; review by hand");
    }
    text = text.replace(/(?<!!)\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)(\s+"[^"]*")?\)/g, (full, linkText, href, title = "") => {
      if (/^(https?:|mailto:|#)/.test(href)) return full;
      const next = resolveLink(page.rel, href);
      return next === null ? linkText : `[${linkText}](${next}${title})`;
    });
    parts[i] = text;
  }
  let body = parts.join("").replace(/\n{3,}/g, "\n\n").trim();
  const title = fm.title || body.match(/^#\s+(.+)$/m)?.[1] || page.rel.replace(/\.(md|mdx)$/, "");
  if (!/^#\s/.test(body.split("\n").find((line) => line.trim()) ?? "")) body = `# ${title}\n\n${body}`;
  const header = `<!-- ${MARKER}docs/laptech/${page.rel} by ${SCRIPT_NAME}. Edit the source, not this page. -->\n`;
  return `${header}${body}\n`;
}

function generatedReadme(pages) {
  const lines = [
    "# Laptech Wiki",
    "",
    "Generated from [`technical-documents` `docs/laptech`](https://github.com/newtc22222/technical-documents/tree/main/docs/laptech).",
    "Edit that source, then from a technical-documents checkout run `npm run sync:laptech-wiki -- --out <local clone> --apply`. Commit and push the clone separately. The command without `--apply` only prints a dry run. Do not edit these pages in place.",
    "",
    "Pages under a path segment that starts with `_` are private and are not published. Other products in technical-documents are not part of this repository.",
    "",
    "## Pages",
    "",
  ];
  for (const page of pages) lines.push(`- [${page.rel}](${page.rel})`);
  lines.push("");
  return `<!-- ${MARKER}docs/laptech by ${SCRIPT_NAME}. Edit the source, not this page. -->\n${lines.join("\n")}`;
}

const ACCOUNT_HOST = /pub-(?!example\.)[0-9a-f]{8,}\.r2\.dev/i;
const PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const AWS_ACCESS_KEY = /AKIA[0-9A-Z]{16}/;

function assertNoSecrets(rel, content) {
  if (ACCOUNT_HOST.test(content)) fail(`${rel} contains a real r2.dev account host. Refusing to publish.`);
  if (PRIVATE_KEY.test(content)) fail(`${rel} contains a private key. Refusing to publish.`);
  if (AWS_ACCESS_KEY.test(content)) fail(`${rel} contains an AWS access key id. Refusing to publish.`);
}

const pages = [...published.values()].sort((a, b) => a.rel.localeCompare(b.rel));
const outputs = pages.map((page) => ({ rel: page.rel, content: convert(page) }));
outputs.push({ rel: "README.md", content: generatedReadme(pages) });

for (const output of outputs) assertNoSecrets(output.rel, output.content);
const foreign = outputs.filter((output) => /(^|\/)(ff-restaurent|lingu-flow)\//.test(output.rel));
if (foreign.length) fail(`refusing to publish other products: ${foreign.map((output) => output.rel).join(", ")}`);

function lineDiff(before, after) {
  const left = before.split("\n");
  const right = after.split("\n");
  if (left.length * right.length > 4_000_000) return ["  (too large for inline diff)"];
  const dp = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const diff = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) diff.push(`- ${left[i++]}`);
    else diff.push(`+ ${right[j++]}`);
  }
  while (i < left.length) diff.push(`- ${left[i++]}`);
  while (j < right.length) diff.push(`+ ${right[j++]}`);
  return diff;
}

console.log(`# sync-laptech-wiki  mode=${apply ? "APPLY" : "DRY-RUN"}  out=${outDir ?? "(none)"}`);
console.log(`\n## Page list (${outputs.length} files)`);

let changed = 0;
const keep = new Set(outputs.map((output) => output.rel));
for (const output of outputs) {
  const target = outDir ? path.join(outDir, ...output.rel.split("/")) : null;
  const old = target && fs.existsSync(target) ? readText(target) : null;
  const state = old === null ? "NEW" : old === output.content ? "same" : "CHANGED";
  if (state !== "same") changed++;
  console.log(`${state.padEnd(8)} ${output.rel}`);
  if (!quietDiff && state !== "same" && output.rel !== "README.md") {
    const diff = lineDiff(old ?? "", output.content).filter((line) => line.startsWith("+") || line.startsWith("-"));
    for (const line of diff.slice(0, 6)) console.log(`    ${line.slice(0, 140)}`);
    if (diff.length > 6) console.log(`    ... (${diff.length - 6} more diff lines)`);
  }
  if (apply && state !== "same") {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, output.content, "utf8");
  }
}

if (apply) {
  const removeGenerated = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      const rel = posix(path.join(prefix, entry.name));
      if (entry.isDirectory()) {
        removeGenerated(full, rel);
        if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      if (keep.has(rel)) continue;
      const text = readText(full);
      if (!text.includes(MARKER)) {
        warn(rel, "left untouched (no generated-from marker)");
        continue;
      }
      fs.rmSync(full);
      console.log(`REMOVED  ${rel}`);
    }
  };
  removeGenerated(outDir, "");
}

console.log(`\n## Conversion warnings (${warnings.length})`);
for (const warning of warnings) console.log(`  ${warning}`);
console.log(`\n${apply ? "Wrote" : "Would write"} ${changed} of ${outputs.length} files. No git or network operation was performed.`);
if (!apply) console.log("DRY-RUN: nothing written. Use --out <clone> --apply to write locally. Commit and push are a separate step.");
