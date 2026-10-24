#!/usr/bin/env bash
# Самопроверка пакета перед публикацией: ничего не меняет, падает при первой проблеме.
# Запускать из любого места: bash scripts/selftest.sh
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

fail() { printf '✗ %s\n' "$1"; exit 1; }
ok() { printf '✓ %s\n' "$1"; }

# 1. Рабочий ключ не должен лежать в репозитории.
if grep -rIn -I --exclude-dir=.git --exclude-dir=node_modules -E 'srz_live_[A-Za-z0-9_-]{6,}' . >/dev/null 2>&1; then
  grep -rIln --exclude-dir=.git --exclude-dir=node_modules -E 'srz_live_[A-Za-z0-9_-]{6,}' .
  fail "в репозитории найден рабочий ключ"
fi
ok "рабочих ключей нет"

# 2. Переводы строк — LF, без BOM.
if grep -rIl --exclude-dir=.git --exclude-dir=node_modules $'\r' . >/dev/null 2>&1; then
  grep -rIl --exclude-dir=.git --exclude-dir=node_modules $'\r' .
  fail "найдены файлы с CRLF"
fi
ok "переводы строк LF"

# 3. Каждый skills/*/SKILL.md: frontmatter, имя = каталог, ссылки, без плейсхолдеров.
node - "$root" <<'NODE'
const { readFileSync, existsSync, readdirSync } = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const skillsRoot = path.join(root, "skills");
const dirs = readdirSync(skillsRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
if (dirs.length === 0) throw new Error("в skills/ нет ни одного скилла");
const seen = new Set();
for (const dir of dirs) {
  const file = path.join(skillsRoot, dir, "SKILL.md");
  if (!existsSync(file)) throw new Error(`${dir}: нет SKILL.md`);
  const text = readFileSync(file, "utf8");
  if (/\{\{[A-Z_]+\}\}/.test(text)) throw new Error(`${dir}: остались плейсхолдеры`);
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) throw new Error(`${dir}: нет YAML frontmatter`);
  const frontmatter = match[1];
  for (const field of ["name", "description"]) {
    if (!new RegExp(`^${field}:`, "m").test(frontmatter)) throw new Error(`${dir}: frontmatter без ${field}`);
  }
  if (!/^description:\s*"/m.test(frontmatter)) throw new Error(`${dir}: description не в кавычках`);
  const name = /^name:\s*(\S+)\s*$/m.exec(frontmatter)?.[1];
  if (name !== dir) throw new Error(`${dir}: name «${name}» не совпадает с каталогом`);
  if (seen.has(name)) throw new Error(`дубль скилла ${name}`);
  seen.add(name);
  const links = [...text.matchAll(/\]\((references\/[^)#\s]+)\)/g)].map((m) => m[1]);
  for (const link of links) {
    if (!existsSync(path.join(skillsRoot, dir, link))) throw new Error(`${dir}: битая ссылка ${link}`);
  }
}
console.log(`✓ ${dirs.length} скиллов: frontmatter, имена, ссылки, без плейсхолдеров`);
NODE

# 4. Артефакты совпадают с источником правды.
node scripts/generate.mjs --check >/dev/null
ok "skills/, README, docs, llms.txt, VERSION, манифесты, SHA256SUMS совпадают с источниками"

# 5. Контрольные суммы сходятся.
sha256sum -c SHA256SUMS.txt --quiet
ok "контрольные суммы сходятся"

# 6. Относительные ссылки в документации ведут на существующие файлы.
node - "$root" <<'NODE'
const { readFileSync, existsSync } = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const broken = [];
const docs = ["README.md", "README.ru.md", "SECURITY.md", "CONTRIBUTING.md", "docs/tools.md"];
for (const doc of docs) {
  const file = path.join(root, doc);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [, target] of text.matchAll(/\]\(([^)#\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    if (!existsSync(path.join(root, target))) broken.push(`${doc} → ${target}`);
  }
}
if (broken.length > 0) throw new Error("битые относительные ссылки:\n  " + broken.join("\n  "));
console.log("✓ относительные ссылки в документации ведут на существующие файлы");
NODE

printf '\nпакет готов к публикации\n'
