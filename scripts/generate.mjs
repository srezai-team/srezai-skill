#!/usr/bin/env node
// Единственный источник правды: src/tools.json.
// Производные артефакты: блок в SKILL.md (+штамп версии во frontmatter), docs/tools.md,
// llms.txt, VERSION, SHA256SUMS.txt.
//
//   node scripts/generate.mjs          — пересобрать артефакты
//   node scripts/generate.mjs --check  — ничего не писать, упасть при расхождении (для CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const src = JSON.parse(readFileSync(join(root, "src/tools.json"), "utf8"));

const die = (message) => {
  console.error(message);
  process.exit(1);
};

// --- проверки источника -----------------------------------------------------
const REQUIRED = ["name", "purpose", "purpose_en", "price", "price_en", "key_params", "when_not"];
const problems = [];
const seen = new Set();
for (const tool of src.tools) {
  if (seen.has(tool.name)) problems.push(`дубль инструмента: ${tool.name}`);
  seen.add(tool.name);
  if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) problems.push(`${tool.name}: имя не в snake_case`);
  for (const field of REQUIRED) {
    if (!tool[field] || String(tool[field]).trim() === "") problems.push(`${tool.name}: пустое поле ${field}`);
  }
}
if (!/^\d+\.\d+\.\d+$/.test(src.version)) problems.push(`версия «${src.version}» не в формате semver`);
if (problems.length > 0) die("src/tools.json невалиден:\n" + problems.map((p) => "  - " + p).join("\n"));

// --- производный текст ------------------------------------------------------
const billable = src.tools.filter((t) => t.billable !== false).length;

const taskMap = [
  "| Что нужно | Инструмент | Цена |",
  "|---|---|---|",
  ...src.tools.map((t) => `| ${t.purpose} | \`${t.name}\`${t.limit ? ` (${t.limit})` : ""} | ${t.price} |`),
  "",
  `*Инструментов: ${src.tools.length} — ${billable} платных и ${src.tools.length - billable} бесплатный. ` +
    `1 кредит = ${src.credit_rub} ₽. Цены сверяются со счётом через \`get_usage\`.*`,
].join("\n");

// Английская таблица — для README (лендинг репозитория) и llms.txt.
const taskMapEn = [
  "| What you need | Tool | Price |",
  "|---|---|---|",
  ...src.tools.map((t) => `| ${t.purpose_en} | \`${t.name}\` | ${t.price_en} |`),
].join("\n");

const reference = [
  "# Инструменты srezai — справочник",
  "",
  `> Сгенерировано из \`src/tools.json\` (версия ${src.version}, ${src.updated}). Руками не править:`,
  "> правка источника + `node scripts/generate.mjs`.",
  "",
  `MCP: \`${src.server.mcp_url}\` · REST: \`${src.server.rest_base}\` · доки: ${src.server.docs}`,
  "",
  "| Инструмент | Зачем | Цена | Объём | Когда НЕ он |",
  "|---|---|---|---|---|",
  ...src.tools.map(
    (t) => `| \`${t.name}\` | ${t.purpose} | ${t.price} | ${t.limit || "—"} | ${t.when_not} |`,
  ),
  "",
  "## Параметры",
  "",
  ...src.tools.map((t) => `- **\`${t.name}\`** — ${t.key_params}`),
  "",
].join("\n");

const llms = [
  "# srezai — web access for AI agents",
  "",
  `${src.tools.length} tools over MCP at ${src.server.mcp_url}. Runet-first coverage,`,
  "PDF, screenshots, site crawls, schema extraction, claim verification with quotes.",
  "",
  ...src.tools.map((t) => `- ${t.name}: ${t.purpose_en}. Price: ${t.price_en}.`),
  "",
  `Generated from src/tools.json v${src.version}.`,
  "",
].join("\n");

// --- правка SKILL.md --------------------------------------------------------
const spliceBlock = (text, tag, body) => {
  const re = new RegExp(`(<!-- GENERATED:${tag}[^>]*-->)([\\s\\S]*?)(<!-- /GENERATED:${tag} -->)`);
  if (!re.test(text)) die(`в SKILL.md нет блока «${tag}»`);
  return text.replace(re, (_all, open, _old, close) => `${open}\n${body}\n${close}`);
};

// Версия и дата живут только в src/tools.json — во frontmatter они штампуются.
const stampFrontmatter = (text) => {
  const re = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
  const match = re.exec(text);
  if (!match) die("в SKILL.md нет YAML frontmatter");
  if (!/version:\s*"/.test(match[2])) die("во frontmatter нет поля version");
  if (!/updated:\s*\d{4}-\d{2}-\d{2}/.test(match[2])) die("во frontmatter нет поля updated");
  const stamped = match[2]
    .replace(/(version:\s*")[^"]*(")/, (_all, before, after) => `${before}${src.version}${after}`)
    .replace(/(updated:\s*)\d{4}-\d{2}-\d{2}/, (_all, before) => `${before}${src.updated}`);
  return text.replace(re, (_all, open, _body, close) => `${open}${stamped}${close}`);
};

const skillPath = join(root, "SKILL.md");
const readmePath = join(root, "README.md");
const artifacts = [
  { path: skillPath, content: spliceBlock(stampFrontmatter(readFileSync(skillPath, "utf8")), "tools", taskMap) },
  { path: readmePath, content: spliceBlock(readFileSync(readmePath, "utf8"), "tools-readme", taskMapEn) },
  { path: join(root, "docs/tools.md"), content: reference },
  { path: join(root, "llms.txt"), content: llms },
  { path: join(root, "VERSION"), content: `${src.version}\n` },
];

// --- контрольные суммы ------------------------------------------------------
const SKIP_DIRS = new Set([".git", "node_modules"]);
const CHECKSUMS = "SHA256SUMS.txt";

const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else if (entry.isFile()) found.push(full);
  }
  return found;
};

const byPath = new Map(artifacts.map((a) => [a.path, a.content]));
const lines = [];
for (const file of walk(root)) {
  const relativePath = file.slice(root.length + 1).split("\\").join("/");
  if (relativePath === CHECKSUMS) continue;
  const content = byPath.has(file) ? byPath.get(file) : readFileSync(file);
  lines.push(`${createHash("sha256").update(content).digest("hex")}  ${relativePath}`);
}
artifacts.push({ path: join(root, CHECKSUMS), content: lines.join("\n") + "\n" });

// --- запись или проверка ----------------------------------------------------
let drifted = 0;
for (const artifact of artifacts) {
  const relativePath = artifact.path.slice(root.length + 1);
  const current = existsSync(artifact.path) ? readFileSync(artifact.path, "utf8") : null;
  if (current === artifact.content) {
    console.log(`= ${relativePath}`);
    continue;
  }
  drifted += 1;
  if (checkOnly) {
    console.error(`! ${relativePath} — расходится с src/tools.json`);
    continue;
  }
  mkdirSync(dirname(artifact.path), { recursive: true });
  writeFileSync(artifact.path, artifact.content, "utf8");
  console.log(`+ ${relativePath}`);
}

if (checkOnly && drifted > 0) {
  die(`\n${drifted} артефакт(ов) устарели: запусти node scripts/generate.mjs и закоммить.`);
}
console.log(checkOnly ? "\nвсе артефакты совпадают с источником" : `\nготово: версия ${src.version}, инструментов ${src.tools.length}`);
