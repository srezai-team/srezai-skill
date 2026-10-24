# extract — 2–5 конкретных значений со страницы по JSON-схеме

Цена: 2 кредита за ссылку · 1–10 ссылок. Платный.

## CLI

```bash
srezai extract https://example.com/card --schema '{"title":"string","price":"number?"}'
```

## Параметры

url|urls, schema, instruction, engine

## Когда не он

заранее неизвестно, что искать — read_url дешевле вдвое

## Заметки

- сокращённая схема: `?` — необязательное, `[]` — массив
- не знаешь заранее, что искать — `read` вдвое дешевле

## Вывод

pages[].data (только запрошенные поля), missing[]

## Другие каналы

MCP: `extract` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->