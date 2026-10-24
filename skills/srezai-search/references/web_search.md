# web_search — Ссылки, факты, сниппеты

Цена: 1 кредит за вызов · ≤30 результатов. Платный.

## CLI

```bash
srezai search "запрос" --num 5 --depth auto
```

## Параметры

query, num, depth (flash|auto), language (auto|ru|en), includeDomains/excludeDomains (≤10), timeRange, publishedAfter/publishedBefore, excerpts, chunksPerSource, category

## Когда не он

нужен полный текст известной страницы — это read_url

## Заметки

- `--depth flash` — один факт, `auto` — обычный поиск
- `--excerpts` тянет текст топ-страниц без отдельного read

## Вывод

results[]: title, url, content, engine, source, score, publishedDate, relevance

## Другие каналы

MCP: `web_search` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->