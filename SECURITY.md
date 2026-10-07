# Security Policy

## Reporting

Send reports to **support@srezai.ru** with the subject line starting with `[skill]`.

Please include: what you did, what happened, what you expected, and — for anything
reproducible — the smallest example. Do not open a public issue for a security problem.

We work on reports during business days (MSK). Response time depends on load; a report
that includes a reproduction gets an answer first.

## Scope

In scope:

- `SKILL.md` and everything else in this repository — including **prompt-injection
  vectors**: this file is executed as instructions by an agent, so text that makes an
  agent do something a user did not ask for is a vulnerability, not a wording issue.
- The scripts under `scripts/` (argument handling, checksum logic, secret leakage).
- The published artifacts: anything where `sha256sum -c SHA256SUMS.txt` or
  `node scripts/generate.mjs --check` fails on a release tag.
- Supply chain: commits or pull requests that quietly change what an agent is told
  to do, or that add a credential to the repository.

Out of scope:

- The srezai service itself (API, quota, billing) — report that to support@srezai.ru
  without the `[skill]` tag.
- Content that a fetched page happens to contain. The skill already instructs agents to
  treat page text as data and never follow instructions found in it; a page that tries
  this is expected, and the interesting case is an agent that *does* follow it.
- Unsupported client versions and third-party MCP clients.

## What we will never ask for

We never ask for your API key, and no maintainer will request it in an issue, a pull
request or a chat. Anyone who does is attacking you, not helping.
