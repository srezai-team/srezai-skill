# map — Карта сайта: разделы, адреса, объём

Цена: 1 кредит за каждые 10 адресов, минимум 1 · 1–200 адресов. Платный.

## CLI

```bash
srezai map https://docs.example.com --limit 50 --search api
```

## Параметры

url, limit, search, selectPaths, excludePaths, includeSubdomains, intent

## Когда не он

нужен текст страниц — это crawl; одна страница — read_url

## Заметки

- `--select-paths` — по адресу, `--intent` — по смыслу раздела
- `--limit` до 200; платишь за каждые 10 возвращённых адресов

## Вывод

url, total, returned, pages[], sections, source, sitemaps

## Другие каналы

MCP: `map` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->