# fetch_page — Увидеть вёрстку, типографику, сломанную страницу (скриншот)

Цена: 3 кредита; 1, если браузер не отрендерил страницу · 200–50 000 символов текста. Платный.

## CLI

```bash
srezai fetch https://example.com --max-chars 2000
```

## Параметры

url, maxChars

## Когда не он

нужен только текст — fetch_page избыточен

## Заметки

- это про вёрстку, а не про текст: для текста `read` втрое дешевле
- `degraded=true` — браузер не отрендерил, списано 1 кредит

## Вывод

screenshotUrl, markdown, degraded

## Другие каналы

MCP: `fetch_page` · REST: `POST https://srezai.ru/api/v1/*` с Bearer-ключом.

Скилл: [../SKILL.md](../SKILL.md) · оглавление: [../../../docs/tools.md](../../../docs/tools.md).

<!-- сгенерировано из src/tools.json v0.5.0 (2026-10-24); руками не править -->