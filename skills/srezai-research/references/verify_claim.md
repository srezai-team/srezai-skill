# verify_claim — Проверить одно утверждение с дословными цитатами

Цена: 8 кредитов за вызов · 2–5 источников. Платный.

## CLI

```bash
srezai verify "Node.js 22 — LTS" --language ru --max-sources 3
```

## Параметры

claim, query, language, timeRange, maxSources

## Когда не он

нужен обзор темы — это deep_research; нужен текст страницы — read_url

## Заметки

- `unverified` и `mixed` — честный результат, а не сбой
- каждая цитата сверена с текстом страницы

## Вывод

verdict, confidence, agreeing/disagreeing, evidence[] с цитатами, caveats

## Другие каналы

MCP: `verify_claim` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->