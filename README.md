# srezai skills — web access for AI agents, without burning the context

Six narrow skills plus a zero-dependency CLI for the [srezai](https://srezai.ru) web API:
web search, page reading (HTML, PDF, Office), site maps and crawls, schema-based
extraction, claim verification with quotes, synthesized answers, deep research and
YouTube transcripts. Runet-first coverage.

**Why skills + CLI.** An MCP server sends every tool schema in every request — for
srezai that is ≈10.8k tokens (13 tools + instructions). These six skill descriptions
cost **≈440 tokens total** (o200k), and the CLI keeps tool schemas out of the context
window: a typical task reads one skill (≈700–1,200 tokens) and one reference
(≈300 tokens). MCP stays for hosts that have no shell: Claude Desktop, ChatGPT
connectors, n8n.

## Install

### Skills (any agent that reads `SKILL.md`)

```bash
npx skills add srezai-team/srezai-web-search-pro-skill
```

Claude Code plugin:

```bash
/plugin marketplace add srezai-team/srezai-web-search-pro-skill
/plugin install srezai-skills@srezai-skills
```

DSH or manual install (copies `skills/*` into your skills directory):

```bash
bash scripts/install.sh
```

### CLI

```bash
npx srezai-cli --help
npm install -g srezai-cli
```

The skills call `srezai ...` when a shell is available and fall back to MCP when it
is not. CLI repo: [srezai-team/srezai-cli](https://github.com/srezai-team/srezai-cli).

### Key

```bash
export SREZAI_API_KEY=srz_live_…      # or ~/.config/srezai/config.json (chmod 600)
```

No key yet? `search`, `read` and `transcript` work in a free trial (25 requests/day
per IP). `srezai register --email you@example.com` creates an agent account with 20
starter credits and returns the key once plus a no-login top-up link.

## Skills

| Skill | Use it when | Tools |
|---|---|---|
| `srezai-web` | entry point: which channel (CLI/MCP/REST), keys, trial, billing, economy, errors | `get_usage` |
| `srezai-search` | "find links/facts/news/images" | `web_search`, `image_search` |
| `srezai-read` | "read this page", "pull these fields", "show me the layout" | `read_url`, `read_urls`, `extract`, `fetch_page` |
| `srezai-site` | "what pages does this site have", "crawl this section" | `map`, `crawl` |
| `srezai-research` | "check this claim", "give me an answer", "research this topic" | `verify_claim`, `answer_search`, `deep_research` |
| `srezai-transcript` | "subtitles", "what is said in this video" | `yt_srt` |

## Tools at a glance

<!-- GENERATED:tools-readme — источник src/tools.json, сборка: node scripts/generate.mjs -->
| What you need | Tool | Price |
|---|---|---|
| Search the web: links, facts, snippets | `web_search` | 1 credit per call |
| Find images and direct file URLs | `image_search` | 1 credit per call |
| Read the text of a page whose URL you already have | `read_url` | 1 credit per call |
| Read several known pages in one batch | `read_urls` | 1 credit per link |
| Pull a few specific values off a page with a JSON schema | `extract` | 2 credits per link |
| See the layout, typography or a broken page as a screenshot | `fetch_page` | 3 credits; 1 if the browser could not render the page |
| Map a site: sections, URLs, how large it is | `map` | 1 credit per 10 URLs returned, minimum 1 |
| Walk a section of a site and read its pages | `crawl` | map + 1 credit per page read |
| Check one claim and get a verdict with verbatim quotes | `verify_claim` | 8 credits per call |
| Get one synthesized answer across several sources | `answer_search` | 3 (fast) / 5 (balanced) / 10 (deep) credits |
| Run multi-step research and get a finished answer with sources | `deep_research` | 20 credits + 3 per 1000 output tokens |
| YouTube video text: transcripts, summaries, quotes | `yt_srt` | 1 credit per video; 15 with speaker labeling |
| Check balance, remaining quota, spend and the price list | `get_usage` | free; does not use the quota |
<!-- /GENERATED:tools-readme -->

## Cost model

1 credit = 0.10 ₽. Cheap ladder first: `search` (1) → `read` (1 per window) →
`extract` (2/link) / `map` (1 per 10 URLs) → `crawl` (map + 1/page) → `fetch` (3) →
`answer` (3/5/10) → `verify` (8) → `deep` (20 + tokens). The skills enforce "cheapest
step that answers the question"; `get_usage` is free.

## What makes it different

- **Runet-first**: strong coverage of Russian-language web, not an afterthought.
- **Files, not just pages**: PDF, Word, Excel, PowerPoint, EPUB are read as Markdown.
- **Honest numbers**: prices, limits and `when not to use this tool` are generated
  from one source (`src/tools.json`), not written into marketing copy.
- **Verification with quotes**: `verify_claim` checks every quote against the page
  text and drops what it cannot find; `unverified`/`mixed` are reported as such.
- **Untrusted content rule**: everything returned from the web is data, never
  instructions — the skills say this explicitly.

## Security

- Skills restrict themselves to `allowed-tools: Bash(srezai *)` where the host
  supports it.
- The CLI has a fixed API host, never prints the key (only `srz_…abcd`), does not
  read local files and does not execute anything from arguments.
- Skills contain no keys and no setup boilerplate duplication; channel setup lives in
  one reference.
- Releases are generated and published with provenance; see [SECURITY.md](SECURITY.md).

## Repository layout

```
src/tools.json            single source of truth for tools, prices, CLI examples
src/skills.json           six skills: descriptions, tool mapping, token budgets
src/skills/<name>/        SKILL.md template + hand-written references
scripts/generate.mjs      builds skills/, references, manifests, docs, VERSION, sums
skills/<name>/SKILL.md    generated — do not edit by hand
.claude-plugin/           plugin.json + marketplace.json (generated)
```

Edit the source, run `node scripts/generate.mjs`, commit both.

## Verify before you trust

```bash
node scripts/generate.mjs --check   # artifacts match the source
sha256sum -c SHA256SUMS.txt         # checksums match
bash scripts/selftest.sh            # secrets, line endings, frontmatter, links
SRZ_API_KEY=… node scripts/check-drift.mjs   # live MCP server still matches the catalog
```

## Contributing · Security · License

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md). Apache-2.0.

Version 0.5.0.
