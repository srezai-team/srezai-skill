# Инструменты srezai — справочник

> Сгенерировано из `src/tools.json` (версия 0.4.2, 2026-10-23). Руками не править:
> правка источника + `node scripts/generate.mjs`.

MCP: `https://srezai.ru/api/mcp` · REST: `https://srezai.ru` · доки: https://srezai.ru/docs/mcp

| Инструмент | Зачем | Цена | Объём | Когда НЕ он |
|---|---|---|---|---|
| `web_search` | Ссылки, факты, сниппеты | 1 кредит за вызов | ≤30 результатов | нужен полный текст известной страницы — это read_url |
| `image_search` | Картинки и прямые ссылки на файлы | 1 кредит за вызов | 1–48 картинок | нужен текст страницы — это read_url |
| `read_url` | Текст известной страницы | 1 кредит за вызов | 200–50 000 символов за окно | адрес ещё неизвестен — сначала web_search |
| `read_urls` | Текст нескольких известных страниц сразу | 1 кредит за каждую ссылку | 1–10 ссылок | нужны отдельные поля, а не текст — это extract; страница одна — read_url |
| `extract` | 2–5 конкретных значений со страницы по JSON-схеме | 2 кредита за ссылку | 1–10 ссылок | заранее неизвестно, что искать — read_url дешевле вдвое |
| `fetch_page` | Увидеть вёрстку, типографику, сломанную страницу (скриншот) | 3 кредита; 1, если браузер не отрендерил страницу | 200–50 000 символов текста | нужен только текст — fetch_page избыточен |
| `map` | Карта сайта: разделы, адреса, объём | 1 кредит за каждые 10 адресов, минимум 1 | 1–200 адресов | нужен текст страниц — это crawl; одна страница — read_url |
| `crawl` | Обойти раздел сайта и прочитать его страницы | карта + 1 кредит за каждую прочитанную страницу | 1–20 страниц | нужен только список адресов — map дешевле |
| `verify_claim` | Проверить одно утверждение с дословными цитатами | 8 кредитов за вызов | 2–5 источников | нужен обзор темы — это deep_research; нужен текст страницы — read_url |
| `answer_search` | Готовый связный ответ по нескольким источникам | 3 (fast) / 5 (balanced) / 10 (deep) кредитов | 2 (fast) – 10 (deep) страниц | нужен список ссылок — web_search в 20 раз дешевле; нужен один факт — тоже мимо |
| `deep_research` | Многошаговое исследование темы с готовым ответом и источниками | 20 кредитов + 3 за каждую 1000 output-токенов | обычно 3–10 минут, до 42 | нужен один факт или список ссылок — это web_search |
| `yt_srt` | Текст ролика YouTube: субтитры, конспект, цитата | 1 кредит за ролик; 15 — с разметкой по спикерам | ≤5 роликов за вызов, окно по from/to, таймкоды, до 200 тыс. символов на ролик — длинный ролик приходит целиком | нужны видео с других площадок (VK, Rutube) — их нет; или нужен сам файл видео; для настоящего разделения по голосу speakers не подходит — это разметка по смыслу реплик |
| `get_usage` | Баланс, остаток квоты, расход и прайс | бесплатно, квоту не расходует | — | не нужен перед каждым вызовом |

## Параметры

- **`web_search`** — query, num, depth (flash|auto), language (auto|ru|en), includeDomains/excludeDomains (≤10), timeRange, publishedAfter/publishedBefore, excerpts, chunksPerSource, category
- **`image_search`** — query, num, timeRange, safe
- **`read_url`** — url, maxChars, offset, engine (auto|fast|dynamic|stealth), fresh
- **`read_urls`** — urls, maxChars (общий для всех), engine, fresh
- **`extract`** — url|urls, schema, instruction, engine
- **`fetch_page`** — url, maxChars
- **`map`** — url, limit, search, selectPaths, excludePaths, includeSubdomains, intent
- **`crawl`** — url, limit, search (по тексту), selectPaths (по адресу), excludePaths, intent
- **`verify_claim`** — claim, query, language, timeRange, maxSources
- **`answer_search`** — query, depth (fast|balanced|deep), language
- **`deep_research`** — query, ticket (дозабор готового ответа — бесплатно)
- **`yt_srt`** — videos (≤5), languages, timestamps, from, to, maxChars, speakers (разметка по говорящим)
- **`get_usage`** — verbose
