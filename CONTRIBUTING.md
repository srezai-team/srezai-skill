# Contributing

Thanks for wanting to improve the skill. Two rules matter more than the rest.

## 1. The tool list lives in exactly one place

`src/tools.json` is the single source of truth for tool names, purposes, limits, prices
and "when NOT to use this tool". `SKILL.md` (the generated block), `docs/tools.md`,
`llms.txt`, `VERSION` and `SHA256SUMS.txt` are produced from it.

```bash
node scripts/generate.mjs          # rebuild the artifacts
node scripts/generate.mjs --check  # what CI runs: fails if they drifted
bash scripts/selftest.sh           # secrets, line endings, frontmatter, checksums, links
```

A pull request that edits a generated file instead of the source is closed with a
pointer to this section — not out of pedantry: a tool list duplicated in two places is
how every documented tool list in this niche ends up stale.

## 2. `SKILL.md` is code

An agent reads `SKILL.md` and acts on it. So a change to it is reviewed like a change to
executable code:

- no instruction that would make an agent act against its user's interest;
- no credential, and no example that looks like a working one;
- no claim we cannot verify — if a tool's behaviour changes, the source of truth changes
  with it, and the drift check must stay green;
- frontmatter must be **strict YAML**: wrap `description` in double quotes. An unquoted
  colon inside it makes agents silently drop the whole skill.

## Pull requests and the mirror

The primary repository is on GitHub; a mirror lives on GitVerse. **Pull requests are
accepted on GitHub only** — otherwise the two histories diverge and the mirror stops
being a mirror. Issues are welcome on either.

## Releases

Releases are semantic, tagged `vX.Y.Z`, with `src/tools.json` bumped first, artifacts
rebuilt from the tag, and `bash scripts/selftest.sh` green. The changelog records what
changed for agents, not just for files.
