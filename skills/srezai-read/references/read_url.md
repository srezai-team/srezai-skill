# read_url — Текст известной страницы

Цена: 1 кредит за вызов · 200–50 000 символов за окно. Платный.

## CLI

```bash
srezai read https://example.com/article --max-chars 4000
```

## Параметры

url, maxChars, offset, engine (auto|fast|dynamic|stealth), fresh

## Когда не он

адрес ещё неизвестен — сначала web_search

## Заметки

- продолжение окна — `--offset` из `meta.nextOffset`, не считать самому
- `--engine dynamic` для SPA, `stealth` — крайний случай

## Вывод

pages[]: url, title, markdown, meta.nextOffset, truncated

## Другие каналы

MCP: `read_url` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->