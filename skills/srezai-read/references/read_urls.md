# read_urls — Текст нескольких известных страниц сразу

Цена: 1 кредит за каждую ссылку · 1–10 ссылок. Платный.

## CLI

```bash
srezai read URL1 URL2 URL3 --max-chars 3000
```

## Параметры

urls, maxChars (общий для всех), engine, fresh

## Когда не он

нужны отдельные поля, а не текст — это extract; страница одна — read_url

## Заметки

- `maxChars` общий на все ссылки; длинные дочитывать по одной

## Вывод

pages[] — по элементу на ссылку, неудачные в skipped

## Другие каналы

MCP: `read_urls` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->