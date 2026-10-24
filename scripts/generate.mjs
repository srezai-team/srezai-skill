#!/usr/bin/env node
// Единственный источник правды: src/tools.json + src/skills.json.
// Производные артефакты: skills/<имя>/SKILL.md, skills/<имя>/references/*.md,
// .claude-plugin/plugin.json, .claude-plugin/marketplace.json, docs/tools.md,
// блок в README.md, llms.txt, VERSION, SHA256SUMS.txt.
//
//   node scripts/generate.mjs          — пересобрать артефакты
//   node scripts/generate.mjs --check  — ничего не писать, упасть при расхождении (для CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const src = JSON.parse(readFileSync(join(root, "src/tools.json"), "utf8"));
const cfg = JSON.parse(readFileSync(join(root, "src/skills.json"), "utf8"));

const die = (message) => {
  console.error(message);
  process.exit(1);
};

// --- проверки источников ----------------------------------------------------
const REQUIRED_TOOL = ["name", "purpose", "purpose_en", "price", "price_en", "key_params", "when_not", "cli", "output", "skill"];
const REQUIRED_SKILL = ["name", "title", "description", "tools"];
const problems = [];
const seen = new Set();
const toolByName = new Map();
for (const tool of src.tools) {
  if (seen.has(tool.name)) problems.push(`дубль инструмента: ${tool.name}`);
  seen.add(tool.name);
  toolByName.set(tool.name, tool);
  if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) problems.push(`${tool.name}: имя не в snake_case`);
  for (const field of REQUIRED_TOOL) {
    if (!tool[field] || String(tool[field]).trim() === "") problems.push(`${tool.name}: пустое поле ${field}`);
  }
  if (!Array.isArray(tool.notes) || tool.notes.length === 0) problems.push(`${tool.name}: нужен непустой notes[]`);
}
if (!/^\d+\.\d+\.\d+$/.test(src.version)) problems.push(`версия «${src.version}» не в формате semver`);

const skillNames = new Set();
const toolSkill = new Map();
for (const skill of cfg.skills) {
  if (skillNames.has(skill.name)) problems.push(`дубль скилла: ${skill.name}`);
  skillNames.add(skill.name);
  for (const field of REQUIRED_SKILL) {
    if (!skill[field] || String(skill[field]).trim() === "") problems.push(`${skill.name}: пустое поле ${field}`);
  }
  for (const toolName of skill.tools) {
    if (!toolByName.has(toolName)) problems.push(`${skill.name}: неизвестный инструмент ${toolName}`);
    if (toolSkill.has(toolName)) problems.push(`${toolName}: уже отнесён к ${toolSkill.get(toolName)}`);
    toolSkill.set(toolName, skill.name);
  }
}
for (const tool of src.tools) {
  if (tool.skill !== toolSkill.get(tool.name)) {
    problems.push(`${tool.name}: skill="${tool.skill}", а в skills.json — "${toolSkill.get(tool.name) ?? "нет"}"`);
  }
}
if (problems.length > 0) die("источники невалидны:\n" + problems.map((p) => "  - " + p).join("\n"));

const budget = cfg.budget;
const descriptionChars = cfg.skills.reduce((sum, skill) => sum + skill.description.length, 0);
if (descriptionChars > budget.descriptions_chars) {
  die(`бюджет описаний: ${descriptionChars} символов > ${budget.descriptions_chars}`);
}

// --- общие куски разметки ---------------------------------------------------
const table = (rows) => rows.join("\n");
const refLink = (toolName) => `[references/${toolName}.md](references/${toolName}.md)`;

const toolsSummary = (skill) =>
  table([
    "| Инструмент | Зачем | Цена |",
    "|---|---|---|",
    ...skill.tools.map((name) => {
      const t = toolByName.get(name);
      return `| \`${t.name}\` | ${t.purpose} | ${t.price} |`;
    }),
  ]);

const toolDetails = (tool) =>
  table([
    `### \`${tool.name}\` — ${tool.purpose}`,
    "",
    "```bash",
    tool.cli,
    "```",
    "",
    `${tool.price}${tool.limit ? ` · ${tool.limit}` : ""}. Параметры: ${tool.key_params}.`,
    "",
    `Когда НЕ он: ${tool.when_not}.`,
    "",
    ...tool.notes.map((n) => `- ${n}`),
    "",
    `Вывод: ${tool.output}. Подробнее — ${refLink(tool.name)}.`,
  ]);

const skillRouter = () =>
  table([
    "| Скилл | Когда брать |",
    "|---|---|",
    ...cfg.skills.map((s) => `| [\`${s.name}\`](../${s.name}/SKILL.md) | ${s.title.split("— ").slice(1).join("— ") || s.description.slice(0, 80)} |`),
  ]);

const expand = (template, skill) => {
  const values = {
    // YAML: двоеточие внутри описания ломает plain-scalar, поэтому всегда в кавычках.
    DESCRIPTION: JSON.stringify(skill.description),
    VERSION: src.version,
    SKILL_ROUTER: skillRouter(),
    TOOLS_SUMMARY: toolsSummary(skill),
    TOOL_DETAILS: skill.tools.map((name) => toolDetails(toolByName.get(name))).join("\n\n"),
    CLI_EXAMPLE: toolByName.get(skill.tools[0]).cli,
  };
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  const left = out.match(/\{\{[A-Z_]+\}\}/g);
  if (left) die(`${skill.name}: в шаблоне остались плейсхолдеры ${left.join(", ")}`);
  return out;
};

const referenceDoc = (tool) =>
  table([
    `# ${tool.name} — ${tool.purpose}`,
    "",
    `Цена: ${tool.price}${tool.limit ? ` · ${tool.limit}` : ""}. ${tool.billable ? "Платный." : "Бесплатный."}`,
    "",
    "## CLI",
    "",
    "```bash",
    tool.cli,
    "```",
    "",
    "## Параметры",
    "",
    tool.key_params,
    "",
    "## Когда не он",
    "",
    tool.when_not,
    "",
    "## Заметки",
    "",
    ...tool.notes.map((n) => `- ${n}`),
    "",
    "## Вывод",
    "",
    tool.output,
    "",
    "## Другие каналы",
    "",
    `MCP: \`${tool.name}\` · REST: \`POST ${src.server.rest_base}/api/v1/*\` с Bearer-ключом.`,
    "",
    `Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).`,
    "",
    `<!-- сгенерировано из src/tools.json v${src.version} (${src.updated}); руками не править -->`,
  ]);

// --- артефакты --------------------------------------------------------------
const artifacts = [];
const skillDirs = [];
const pluginSkills = [];

for (const skill of cfg.skills) {
  const templatePath = join(root, "src/skills", skill.name, "SKILL.md.tpl");
  if (!existsSync(templatePath)) die(`${skill.name}: нет шаблона ${templatePath}`);
  const skillMd = expand(readFileSync(templatePath, "utf8"), skill);
  if (skillMd.length > budget.skill_md_chars) {
    die(`${skill.name}: SKILL.md ${skillMd.length} символов > ${budget.skill_md_chars}`);
  }
  const skillDir = join(root, "skills", skill.name);
  skillDirs.push(skillDir);
  pluginSkills.push(`./skills/${skill.name}`);
  artifacts.push({ path: join(skillDir, "SKILL.md"), content: skillMd });

  for (const toolName of skill.tools) {
    const ref = referenceDoc(toolByName.get(toolName));
    if (ref.length > budget.reference_chars) {
      die(`${skill.name}/references/${toolName}.md: ${ref.length} символов > ${budget.reference_chars}`);
    }
    artifacts.push({ path: join(skillDir, "references", `${toolName}.md`), content: ref });
  }

  const extraDir = join(root, "src/skills", skill.name, "references");
  if (existsSync(extraDir)) {
    for (const file of readdirSync(extraDir)) {
      artifacts.push({
        path: join(skillDir, "references", file),
        content: readFileSync(join(extraDir, file), "utf8"),
      });
    }
  }
}

// --- README, docs, llms, манифесты -----------------------------------------
const taskMap = table([
  "| Что нужно | Инструмент | Цена |",
  "|---|---|---|",
  ...src.tools.map((t) => `| ${t.purpose} | \`${t.name}\`${t.limit ? ` (${t.limit})` : ""} | ${t.price} |`),
  "",
  `*Инструментов: ${src.tools.length}; 1 кредит = ${src.credit_rub} ₽.*`,
]);

const taskMapEn = table([
  "| What you need | Tool | Price |",
  "|---|---|---|",
  ...src.tools.map((t) => `| ${t.purpose_en} | \`${t.name}\` | ${t.price_en} |`),
]);

const reference = table([
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
]);

const llms = table([
  "# srezai — web access for AI agents",
  "",
  `${src.tools.length} tools over MCP at ${src.server.mcp_url}; the same tools via CLI \`srezai\``,
  "(npm package `srezai-cli`, zero dependencies) and REST base " + src.server.rest_base + ".",
  "Runet-first coverage, PDF, screenshots, site crawls, schema extraction, claim",
  "verification with quotes, synthesized answers and deep research.",
  "",
  "## Skills (6 narrow skills, Apache-2.0)",
  "",
  "```bash",
  "npx skills add srezai-team/srezai-web-search-pro-skill",
  "```",
  "",
  ...cfg.skills.map((s) => `- ${s.name}: ${s.title.split("— ").slice(1).join("— ") || s.title}`),
  "",
  "## Tools",
  "",
  ...src.tools.map((t) => `- ${t.name}: ${t.purpose_en}. Price: ${t.price_en}.`),
  "",
  `Generated from src/tools.json v${src.version}.`,
  "",
]);

const pluginJson = JSON.stringify(
  {
    name: "srezai-skills",
    version: src.version,
    description:
      "Веб-доступ для агентов через srezai: поиск, чтение страниц, карты сайтов, извлечение по схеме, проверка фактов, готовые ответы и глубокие исследования.",
    author: { name: "srezai", url: "https://srezai.ru" },
    homepage: "https://srezai.ru/docs/skills",
    repository: "https://github.com/srezai-team/srezai-web-search-pro-skill",
    license: "Apache-2.0",
    keywords: ["web-search", "ai-agents", "mcp", "cli", "runet", "fact-checking"],
    skills: pluginSkills,
  },
  null,
  2,
) + "\n";

const marketplaceJson = JSON.stringify(
  {
    name: "srezai-skills",
    owner: { name: "srezai", url: "https://srezai.ru" },
    plugins: [
      {
        name: "srezai-skills",
        source: "./",
        description:
          "6 узких скиллов srezai: веб-поиск, чтение страниц, карты сайтов, проверка фактов, ответы, субтитры YouTube. Работают через CLI srezai, MCP или REST.",
      },
    ],
  },
  null,
  2,
) + "\n";

artifacts.push(
  { path: join(root, "docs/tools.md"), content: reference },
  { path: join(root, "llms.txt"), content: llms },
  { path: join(root, "VERSION"), content: `${src.version}\n` },
  { path: join(root, ".claude-plugin/plugin.json"), content: pluginJson },
  { path: join(root, ".claude-plugin/marketplace.json"), content: marketplaceJson },
);

// README: только блок инструментов (остальное правится руками).
const readmePath = join(root, "README.md");
if (existsSync(readmePath)) {
  const splice = (text, tag, body) => {
    const re = new RegExp(`(<!-- GENERATED:${tag}[^>]*-->)([\\s\\S]*?)(<!-- /GENERATED:${tag} -->)`);
    if (!re.test(text)) return null;
    return text.replace(re, (_all, open, _old, close) => `${open}\n${body}\n${close}`);
  };
  const spliced = splice(readFileSync(readmePath, "utf8"), "tools-readme", taskMapEn);
  if (spliced) artifacts.push({ path: readmePath, content: spliced });
}

// --- чистка осиротевших скиллов -------------------------------------------
const skillsRoot = join(root, "skills");
if (!checkOnly && existsSync(skillsRoot)) {
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(skillsRoot, entry.name);
    if (!skillDirs.includes(full)) {
      rmSync(full, { recursive: true, force: true });
      console.log(`- удалён осиротевший скилл skills/${entry.name}`);
    }
  }
}
// Корневой SKILL.md больше не существует: скиллы живут в skills/*/SKILL.md.
if (!checkOnly && existsSync(join(root, "SKILL.md"))) {
  rmSync(join(root, "SKILL.md"));
  console.log("- удалён корневой SKILL.md (переехал в skills/*/SKILL.md)");
}

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
if (!checkOnly) {
  const est = Math.ceil(descriptionChars / 3.1);
  console.log(`\nописания: ${descriptionChars} символов ≈ ${est} токенов (бюджет ${budget.descriptions_chars} символов)`);
}
console.log(checkOnly ? "\nвсе артефакты совпадают с источником" : `\nготово: версия ${src.version}, скиллов ${cfg.skills.length}, инструментов ${src.tools.length}`);
