#!/usr/bin/env bash
# Установка собранного скилла в каталог скиллов DSH.
# Сначала проверяет, что артефакты не разъехались с src/tools.json,
# потом копирует и печатает контрольные суммы источника и цели.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${DSH_HOME:-$HOME/.dsh}/skills/srezai-web.md"

node "$root/scripts/generate.mjs" --check
install -d "$(dirname "$target")"
install -m 0644 "$root/SKILL.md" "$target"

printf 'установлено: %s\n' "$target"
sha256sum "$root/SKILL.md" "$target"
