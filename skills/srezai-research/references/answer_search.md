# answer_search — Готовый связный ответ по нескольким источникам

Цена: 3 (fast) / 5 (balanced) / 10 (deep) кредитов · 2 (fast) – 10 (deep) страниц. Платный.

## CLI

```bash
srezai answer "вопрос" --depth balanced
```

## Параметры

query, depth (fast|balanced|deep), language

## Когда не он

нужен список ссылок — web_search в 20 раз дешевле; нужен один факт — тоже мимо

## Заметки

- нужен список ссылок — `search` дешевле в 20 раз
- `fast`=3, `balanced`=5, `deep`=10 кредитов

## Вывод

answer, sources[] с relevance, confidence, pagesRead

## Другие каналы

MCP: `answer_search` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->