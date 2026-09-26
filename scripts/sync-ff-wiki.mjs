#!/usr/bin/env node
// Sync FF RESTaurent GitHub wiki pages into docs/ff-restaurent/.
//
// The wiki (private repo newtc22222/ff-restaurent.wiki) is the source of truth.
// This script copies its pages into the public Docusaurus tree:
//   - matches each wiki page to an existing doc by file name
//     (Release-v2.2.0.md -> releases/release-v2.2.0.md), or to a path set in
//     scripts/ff-wiki-sync.config.json for new pages,
//   - keeps the doc's existing front matter, overridden by config values,
//   - rewrites wiki links like [Text](Deployment-Guide) into relative doc links,
//     and unlinks references to pages that are not published,
//   - converts GitHub alerts (> [!NOTE]) into Docusaurus admonitions, strips
//     HTML comments (MDX cannot parse them), and labels bare code fences "text".
//
// Usage:
//   npm run sync:ff-wiki -- --wiki <path-to-ff-restaurent.wiki> [--pages A,B] [--check]
//   --pages  only sync these wiki page names (without .md)
//   --check  report what would change without writing files (exit 1 if anything would)
// FF_WIKI_DIR can be used instead of --wiki. Run `npm run build` afterwards.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "scripts", "ff-wiki-sync.config.json"), "utf8"),
);

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const wikiDir = argValue("--wiki") ?? process.env.FF_WIKI_DIR;
const onlyPages = argValue("--pages")?.split(",").map((s) => s.trim()).filter(Boolean);
const checkOnly = args.includes("--check");

if (!wikiDir || !fs.existsSync(wikiDir)) {
  console.error("Wiki folder not found. Pass --wiki <path> or set FF_WIKI_DIR.");
  process.exit(2);
}
const docsDir = path.join(repoRoot, config.docsDir);

const readText = (file) => fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
const toPosix = (p) => p.split(path.sep).join("/");

// Front matter is kept as ordered raw "key: value" strings so existing values
// (quotes, punctuation) round-trip unchanged.
function splitFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: new Map(), body: text };
  const fm = new Map();
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s?(.*)$/);
    if (kv) fm.set(kv[1], kv[2]);
  }
  return { fm, body: text.slice(m[0].length) };
}

// Existing docs, keyed by lower-case file name without extension.
const existing = new Map();
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".md")) {
      existing.set(entry.name.slice(0, -3).toLowerCase(), toPosix(path.relative(docsDir, full)));
    }
  }
})(docsDir);

const excludePatterns = (config.exclude ?? []).map((p) => new RegExp(p));
const isExcluded = (name) => excludePatterns.some((re) => re.test(name));

const wikiPages = fs
  .readdirSync(wikiDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.slice(0, -3));

// Resolve every wiki page to a doc path (or null if unpublished).
const targets = new Map();
const unmapped = [];
for (const name of wikiPages) {
  if (isExcluded(name)) {
    targets.set(name, null);
    continue;
  }
  const rel = config.pages?.[name]?.path ?? existing.get(name.toLowerCase());
  if (rel) targets.set(name, rel);
  else {
    targets.set(name, null);
    unmapped.push(name);
  }
}

function convertAlerts(body) {
  const kinds = { NOTE: "note", TIP: "tip", IMPORTANT: "info", WARNING: "warning", CAUTION: "danger" };
  const lines = body.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
    if (!m) {
      out.push(lines[i]);
      continue;
    }
    out.push(`:::${kinds[m[1]]}`, "");
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) {
      out.push(lines[++i].replace(/^>\s?/, ""));
    }
    out.push("", ":::");
  }
  return out.join("\n");
}

// MDX cannot parse HTML comments, and bare code fences get a "text" language so
// they render like the rest of the site.
function mdxSafe(body) {
  let inFence = false;
  return body
    .replace(/^[ \t]*<!--[\s\S]*?-->[ \t]*\n?/gm, "")
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*)(```+)(.*)$/);
      if (!m) return line;
      if (!inFence && m[3].trim() === "") line = `${m[1]}${m[2]}text`;
      inFence = !inFence;
      return line;
    })
    .join("\n");
}

function convertLinks(body, fromRel) {
  const fromDir = path.posix.dirname(fromRel);
  let inFence = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return line;
      return line.replace(
        /\[([^\]]*)\]\(([A-Za-z0-9][A-Za-z0-9._-]*?)(?:\.md)?(#[^)\s]*)?\)/g,
        (whole, text, target, anchor = "") => {
          if (!targets.has(target)) return whole; // not a wiki page link
          const rel = targets.get(target);
          if (!rel) return text; // unpublished page: keep the words, drop the link
          let link = path.posix.relative(fromDir, rel);
          if (!link.startsWith(".")) link = `./${link}`;
          return `[${text}](${link}${anchor})`;
        },
      );
    })
    .join("\n");
}

let changed = 0;
const selected = onlyPages ?? wikiPages;
for (const name of selected) {
  if (!wikiPages.includes(name)) {
    console.error(`skip  ${name}: no such wiki page`);
    continue;
  }
  const rel = targets.get(name);
  if (!rel) continue;
  const pageConfig = config.pages?.[name] ?? {};
  if (pageConfig.manual) {
    // Linked to, but edited by hand in the docs (e.g. the curated landing page).
    if (onlyPages) console.error(`skip  ${name}: marked manual in ff-wiki-sync.config.json`);
    continue;
  }
  const dest = path.join(docsDir, rel);
  const current = fs.existsSync(dest) ? readText(dest) : "";
  const fm = splitFrontMatter(current).fm;
  for (const [k, v] of Object.entries(pageConfig.frontMatter ?? {})) fm.set(k, String(v));
  if (!fm.has("id")) {
    console.error(`skip  ${name}: new page needs frontMatter in ff-wiki-sync.config.json`);
    continue;
  }

  let body = splitFrontMatter(readText(path.join(wikiDir, `${name}.md`))).body;
  for (const r of [...(config.replacements ?? []), ...(pageConfig.replacements ?? [])]) {
    body = r.regex ? body.replace(new RegExp(r.from, "gm"), r.to) : body.split(r.from).join(r.to);
  }
  body = convertLinks(convertAlerts(mdxSafe(body)), rel).trimEnd() + "\n";

  const fmText = [...fm].map(([k, v]) => `${k}: ${v}`).join("\n");
  const next = `---\n${fmText}\n---\n\n${body.replace(/^\n+/, "")}`;
  if (next === current) continue;
  changed++;
  console.log(`${current ? "update" : "create"} ${rel}  (from ${name}.md)`);
  if (!checkOnly) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, next, "utf8");
  }
}

for (const name of unmapped) {
  console.warn(`warn  ${name}.md has no doc path; add it to pages or exclude in ff-wiki-sync.config.json`);
}
console.log(`${changed} file(s) ${checkOnly ? "would change" : "written"}.`);
if (checkOnly && changed) process.exit(1);
