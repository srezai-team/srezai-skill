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

# 2. Переводы строк — LF, без BOM (для GitVerse это не мелочь: CRLF ломает job).
if grep -rIl --exclude-dir=.git --exclude-dir=node_modules $'\r' . >/dev/null 2>&1; then
  grep -rIl --exclude-dir=.git --exclude-dir=node_modules $'\r' .
  fail "найдены файлы с CRLF"
fi
ok "переводы строк LF"

# 3. Frontmatter SKILL.md: строгий YAML, если доступен парсер; иначе — проверка кавычек.
node - "$root" <<'NODE'
const { readFileSync } = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const text = readFileSync(path.join(root, "SKILL.md"), "utf8");
const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
if (!match) throw new Error("в SKILL.md нет YAML frontmatter");
const frontmatter = match[1];
for (const field of ["name", "description"]) {
  if (!new RegExp(`^${field}:`, "m").test(frontmatter)) throw new Error(`frontmatter: нет поля ${field}`);
}
if (!/^description:\s*"/m.test(frontmatter)) {
  throw new Error('frontmatter: description не в кавычках — двоеточие внутри ломает строгий YAML-парсер');
}
let parse = null;
for (const candidate of ["yaml", "/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/yaml"]) {
  try { parse = require(candidate).parse; break; } catch { /* необязательная зависимость */ }
}
if (parse) {
  const data = parse(frontmatter);
  if (!data.name || !data.description) throw new Error("frontmatter: name/description не читаются");
  console.log(`✓ frontmatter валиден (строгий YAML), версия ${data.metadata?.version ?? "—"}`);
} else {
  console.log("✓ frontmatter структурно корректен (строгий парсер недоступен)");
}
NODE

# 4. Артефакты совпадают с источником правды.
node scripts/generate.mjs --check >/dev/null
ok "SKILL.md, README.md, docs/tools.md, llms.txt, VERSION, SHA256SUMS.txt совпадают с src/tools.json"

# 5. Контрольные суммы сходятся.
sha256sum -c SHA256SUMS.txt --quiet
ok "контрольные суммы сходятся"

# 6. Относительные ссылки в README ведут на существующие файлы.
node - "$root" <<'NODE'
const { readFileSync, existsSync } = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const broken = [];
for (const doc of ["README.md", "README.ru.md", "SECURITY.md", "CONTRIBUTING.md"]) {
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
