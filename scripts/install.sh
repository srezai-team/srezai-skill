#!/usr/bin/env bash
# Установка собранных скиллов в каталог скиллов DSH.
# Сначала проверяет, что артефакты не разъехались с src/tools.json,
# потом копирует skills/* целиком (SKILL.md + references/).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_dir="${DSH_HOME:-$HOME/.dsh}/skills"

node "$root/scripts/generate.mjs" --check

install -d "$target_dir"
for skill_dir in "$root"/skills/*/; do
  name="$(basename "$skill_dir")"
  rm -rf "$target_dir/$name"
  cp -R "$skill_dir" "$target_dir/$name"
  printf 'установлено: %s/SKILL.md (+ %s справочников)\n' \
    "$target_dir/$name" "$(find "$target_dir/$name/references" -type f 2>/dev/null | wc -l)"
done

# Версия 0.4.x ставилась одним файлом — убираем, чтобы не было двух разных наборов.
if [ -f "$target_dir/srezai-web.md" ]; then
  rm -f "$target_dir/srezai-web.md"
  printf 'удалён старый одиночный скилл: %s/srezai-web.md\n' "$target_dir"
fi

sha256sum "$root"/skills/*/SKILL.md
