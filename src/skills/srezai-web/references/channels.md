# Каналы: CLI, MCP, REST — что выбрать

У srezai один и тот же набор инструментов доступен тремя способами. Выбирай по
возможностям хоста, а не по привычке.

| Канал | Когда | Цена контекста |
|---|---|---|
| CLI `srezai` | есть консоль (Claude Code, Codex, Cursor, DSH, любой shell) | ~0,3–1,5 тыс. токенов на задачу: в контексте только описание скилла |
| MCP `https://srezai.ru/api/mcp` | консоли нет: Claude Desktop, ChatGPT-коннекторы, n8n | ≈10,8 тыс. токенов в каждом запросе (13 схем + инструкции) |
| REST `https://srezai.ru/api/v1/*` | нужен свой клиент или нестандартный рантайм | сколько напишешь сам |

## CLI

```bash
srezai search "запрос" --num 5
srezai read https://example.com/article --max-chars 4000
srezai whoami            # локально: есть ли ключ, куда ходит
```

Установка: `npx srezai-cli --help` (или `npm i -g srezai-cli`). Ключ:
`SREZAI_API_KEY` или `~/.config/srezai/config.json` (chmod 600).

## MCP

```json
{"mcpServers": {"srezai": {"url": "https://srezai.ru/api/mcp",
  "headers": {"Authorization": "Bearer srz_live_…"}}}}
```

Инструменты те же: `web_search`, `read_url`, `read_urls`, `extract`,
`fetch_page`, `map`, `crawl`, `verify_claim`, `answer_search`, `deep_research`,
`yt_srt`, `image_search`, `get_usage`.

## REST

`POST https://srezai.ru/api/v1/<tool>` с `Authorization: Bearer srz_live_…`,
тело — JSON. Ответы совпадают с MCP-инструментами. Триал без ключа — только
`/search`, `/read`, `/transcript`.

## Правило

Не смешивай каналы в одной задаче без причины: CLI и MCP списывают одни и те же
кредиты, но MCP ещё и занимает контекст. Если CLI уже стоит — работай через него.
