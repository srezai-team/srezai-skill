# crawl — Обойти раздел сайта и прочитать его страницы

Цена: карта + 1 кредит за каждую прочитанную страницу · 1–20 страниц. Платный.

## CLI

```bash
srezai crawl https://docs.example.com --select-paths /api/ --limit 10
```

## Параметры

url, limit, search (по тексту), selectPaths (по адресу), excludePaths, intent

## Когда не он

нужен только список адресов — map дешевле

## Заметки

- `--search` фильтрует по ТЕКСТУ страниц, `--select-paths` — по адресу
- сначала `map`, потом `crawl` по нужному разделу — дешевле

## Вывод

pages[], skipped[], credits, meta

## Другие каналы

MCP: `crawl` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->