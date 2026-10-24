# скиллы srezai — веб-доступ для ИИ-агентов без раздувания контекста

Шесть узких скиллов и CLI без зависимостей для веб-API [srezai](https://srezai.ru):
поиск, чтение страниц (HTML, PDF, Office), карты сайтов и обход разделов,
извлечение по JSON-схеме, проверка утверждений с цитатами, готовые ответы, глубокие
исследования и субтитры YouTube. Сильное покрытие рунета.

**Почему скиллы + CLI.** MCP-сервер отдаёт схемы инструментов в каждом запросе — у
srezai это ≈10,8 тыс. токенов (13 инструментов + инструкции). Шесть описаний
здешних скиллов стоят **≈440 токенов суммарно** (o200k), а CLI не держит схемы в
контексте: типовая задача — один скилл (≈700–1 200 токенов) и один справочник
(≈300). MCP остаётся для хостов без консоли: Claude Desktop, ChatGPT-коннекторы, n8n.

## Установка

### Скиллы (любой агент, который читает `SKILL.md`)

```bash
npx skills add srezai-team/srezai-web-search-pro-skill
```

Плагин Claude Code:

```bash
/plugin marketplace add srezai-team/srezai-web-search-pro-skill
/plugin install srezai-skills@srezai-skills
```

DSH или ручная установка (копирует `skills/*` в каталог скиллов):

```bash
bash scripts/install.sh
```

### CLI

```bash
npx srezai-cli --help
npm install -g srezai-cli
```

Скиллы зовут `srezai ...`, когда есть консоль, и откатываются на MCP, когда её нет.
Репозиторий CLI: [srezai-team/srezai-cli](https://github.com/srezai-team/srezai-cli).

### Ключ

```bash
export SREZAI_API_KEY=srz_live_…      # или ~/.config/srezai/config.json (chmod 600)
```

Ключа нет? `search`, `read` и `transcript` работают в пробном режиме (25 запросов в
сутки на IP). `srezai register --email you@example.com` создаёт агентский аккаунт с
20 стартовыми кредитами и возвращает ключ один раз плюс ссылку на оплату без входа.

## Скиллы

| Скилл | Когда брать | Инструменты |
|---|---|---|
| `srezai-web` | вход: какой канал (CLI/MCP/REST), ключ, триал, оплата, экономика, ошибки | `get_usage` |
| `srezai-search` | «найди ссылки/факты/новости/картинки» | `web_search`, `image_search` |
| `srezai-read` | «прочитай страницу», «вытащи поля», «посмотри вёрстку» | `read_url`, `read_urls`, `extract`, `fetch_page` |
| `srezai-site` | «какие страницы на сайте», «обойди раздел» | `map`, `crawl` |
| `srezai-research` | «проверь факт», «собери ответ», «исследуй тему» | `verify_claim`, `answer_search`, `deep_research` |
| `srezai-transcript` | «субтитры», «о чём видео» | `yt_srt` |

## Инструменты

<!-- GENERATED:tools-readme — источник src/tools.json, сборка: node scripts/generate.mjs -->
<!-- /GENERATED:tools-readme -->

## Сколько стоит

1 кредит = 0,10 ₽. Сначала дешёвая ступень: `search` (1) → `read` (1 за окно) →
`extract` (2/ссылка) / `map` (1 за 10 адресов) → `crawl` (карта + 1/страница) →
`fetch` (3) → `answer` (3/5/10) → `verify` (8) → `deep` (20 + токены). Скиллы требуют
«самую дешёвую ступень, которая закрывает задачу»; `get_usage` бесплатен.

## Чем отличается

- **Рунет в первую очередь**, а не по остаточному принципу.
- **Файлы, а не только страницы**: PDF, Word, Excel, PowerPoint, EPUB читаются как Markdown.
- **Честные числа**: цены, лимиты и «когда НЕ этот инструмент» генерируются из
  одного источника (`src/tools.json`), а не вписаны в маркетинговый текст.
- **Проверка с цитатами**: `verify_claim` сверяет каждую цитату с текстом страницы и
  отбрасывает не найденную; `unverified`/`mixed` так и называются.
- **Недоверенный контент**: всё, что вернул веб, — данные, а не инструкции; в
  скиллах это сказано прямо.

## Безопасность

- Скиллы ограничивают себя `allowed-tools: Bash(srezai *)` там, где хост это умеет.
- У CLI фиксированный хост API, ключ никогда не печатается (только `srz_…abcd`),
  локальные файлы не читаются, ничего из аргументов не исполняется.
- В скиллах нет ключей, а общий сетап не дублируется в каждом файле — он лежит в
  одном справочнике.
- Релизы собираются и публикуются с provenance; подробности — [SECURITY.md](SECURITY.md).

## Структура репозитория

```
src/tools.json            единственный источник правды: инструменты, цены, примеры CLI
src/skills.json           шесть скиллов: описания, привязка инструментов, бюджеты
src/skills/<имя>/         шаблон SKILL.md + рукописные справочники
scripts/generate.mjs      собирает skills/, references, манифесты, docs, VERSION, суммы
skills/<имя>/SKILL.md     сгенерировано — руками не править
.claude-plugin/           plugin.json + marketplace.json (сгенерированы)
```

Правь источник, запускай `node scripts/generate.mjs`, коммить и то и другое.

## Проверь, прежде чем доверять

```bash
node scripts/generate.mjs --check   # артефакты совпадают с источником
sha256sum -c SHA256SUMS.txt         # контрольные суммы сходятся
bash scripts/selftest.sh            # секреты, переводы строк, frontmatter, ссылки
SRZ_API_KEY=… node scripts/check-drift.mjs   # живой MCP-сервер всё ещё совпадает с каталогом
```

## Участие · Безопасность · Лицензия

См. [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md). Apache-2.0.

Версия 0.5.0.
